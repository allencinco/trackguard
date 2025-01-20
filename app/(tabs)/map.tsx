import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { getDatabase, ref, onValue } from 'firebase/database';
import { auth } from '../../config/firebaseConfig';

type Coordinate = {
    latitude: number;
    longitude: number;
    timestamp: string;
};

export default function MapScreen() {
    const [location, setLocation] = useState<Coordinate | null>(null);
    const [setPoint, setSetPoint] = useState<Coordinate | null>(null);
    const [userRadiusMeters, setUserRadiusMeters] = useState<number>(100);
    const [isOutOfBounds, setIsOutOfBounds] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const initialRegion = {
        latitude: -33.8688, // Default to Sydney
        longitude: 151.2093,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    useEffect(() => {
        const fetchLocation = async () => {
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            try {
                // Fetch current location
                const currentLocation = await Location.getCurrentPositionAsync({});
                const locationData = {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    timestamp: new Date().toLocaleString(),
                };
                setLocation(locationData);
            } catch (error) {
                setErrorMsg('Failed to fetch location');
                console.error(error);
            }
        };

        fetchLocation();
    }, []);

    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        const db = getDatabase();
        const gpsRef = ref(db, `gps_data/${userId}`);

        const unsubscribe = onValue(gpsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const currentLocation = {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    timestamp: data.timestamp,
                };
                setLocation(currentLocation);

                if (!setPoint) {
                    setSetPoint(currentLocation);
                    setUserRadiusMeters(data.radius || 100);
                }

                if (setPoint) {
                    checkUserDistance(currentLocation, setPoint);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const checkUserDistance = (currentLocation: Coordinate, setPointLocation: Coordinate) => {
        const distance = getDistanceFromLatLonInMeters(
            currentLocation.latitude,
            currentLocation.longitude,
            setPointLocation.latitude,
            setPointLocation.longitude
        );

        if (distance > userRadiusMeters) {
            if (!isOutOfBounds) {
                setIsOutOfBounds(true);
                Alert.alert(
                    'Out of Bounds!',
                    `the user has moved outside the ${userRadiusMeters} meter radius!`
                );
            }
        } else {
            if (isOutOfBounds) {
                setIsOutOfBounds(false);
            }
        }
    };

    const handleMapLongPress = (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        const newSetPoint = {
            latitude,
            longitude,
            timestamp: new Date().toLocaleString(),
        };
        setSetPoint(newSetPoint);
        setUserRadiusMeters(100);
    };

    // Add drag handler function
    const handleMarkerDrag = (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        const newSetPoint = {
            latitude,
            longitude,
            timestamp: new Date().toLocaleString(),
        };
        setSetPoint(newSetPoint);
        
        // Check boundary if location exists
        if (location) {
            checkUserDistance(location, newSetPoint);
        }
    };

    const handleAddRadius = () => {
        setUserRadiusMeters((prevRadius) => prevRadius + 10);
    };

    const handleRemoveRadius = () => {
        setUserRadiusMeters((prevRadius) => (prevRadius > 10 ? prevRadius - 10 : prevRadius));
    };

    const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000; // Radius of Earth in meters
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    };

    const deg2rad = (deg: number) => deg * (Math.PI / 180);

    return (
        <LinearGradient colors={['#083344', '#094155', '#0a4f66']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>
                        Monitor location and set boundaries. Long press to move the boundary circle.
                        Use buttons to adjust the radius.
                    </Text>
                </View>
                <View style={styles.mapContainer}>
                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        region={{
                            latitude: location?.latitude || initialRegion.latitude,
                            longitude: location?.longitude || initialRegion.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        initialRegion={initialRegion}
                        onLongPress={handleMapLongPress}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {setPoint && (
                            <>
                                <Marker
                                    coordinate={{
                                        latitude: setPoint.latitude,
                                        longitude: setPoint.longitude,
                                    }}
                                    title="Set Point"
                                    draggable={true}
                                    onDragEnd={handleMarkerDrag}
                                />
                                <Circle
                                    center={{
                                        latitude: setPoint.latitude,
                                        longitude: setPoint.longitude,
                                    }}
                                    radius={userRadiusMeters}
                                    strokeColor="rgba(255, 0, 0, 0.5)"
                                    fillColor="rgba(255, 0, 0, 0.1)"
                                />
                            </>
                        )}
                        {location && (
                            <Marker
                                coordinate={{
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                }}
                                title="Current Location"
                                description={location.timestamp}
                                pinColor="blue"
                            />
                        )}
                    </MapView>
                </View>
                <View style={styles.controlsContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleAddRadius}>
                        <Text style={styles.buttonText}>Add Radius (+10m)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleRemoveRadius}>
                        <Text style={styles.buttonText}>Remove Radius (-10m)</Text>
                    </TouchableOpacity>
                </View>
                {errorMsg && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flexGrow: 1, paddingTop: 60, paddingHorizontal: 24 },
    instructionsContainer: { marginBottom: 20 },
    instructionsText: { color: '#ffffff', fontSize: 16, textAlign: 'center' },
    mapContainer: { flex: 1, minHeight: 400, borderRadius: 4, overflow: 'hidden', marginBottom: 24 },
    map: { width: '100%', height: '100%' },
    controlsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
    button: {
        backgroundColor: '#155e75',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
    errorContainer: { marginTop: 10 },
    errorText: { color: '#ff4d4d', fontSize: 14, textAlign: 'center' },
});











