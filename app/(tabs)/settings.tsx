import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router'; // Import useRouter from expo-router
import { auth } from '../../config/firebaseConfig'; // Make sure to import your Firebase config

export default function Profile() {
    const router = useRouter(); // Get router object from expo-router

    const handleFeedback = () => {
        console.log('Feedback clicked');
        router.push('/feedback'); // Navigate to the Feedback screen
    };

    const handleChangePassword = () => {
        console.log('Change Password clicked');
    };

    const handleLog = () => {
        console.log('Log clicked');
    };

    const handleLogout = async () => {
        try {
            await auth.signOut(); // Sign out the user
            console.log('Log Out clicked');
            router.push('/login'); // Navigate to the Login screen
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleEditProfile = () => {
        console.log('Edit Profile clicked');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleFeedback} style={styles.button}>
                    <Text style={styles.buttonText}>Feedback</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleChangePassword} style={styles.button}>
                    <Text style={styles.buttonText}>Change Password</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLog} style={styles.button}>
                    <Text style={styles.buttonText}>History</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={styles.button}>
                    <Text style={styles.buttonText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start', // Align items to the top
        alignItems: 'center', // Center items horizontally
        padding: 16,
        backgroundColor: '#f9f9f9',
    },
    header: {
        width: '100%', // Take full width
        alignItems: 'center', // Center the title
        marginBottom: 20, // Space between title and icon
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center', // Center the text
    },
    footer: {
        position: 'absolute',
        bottom: 200, // Adjust this value to move the buttons higher or lower
        width: '100%', // Ensure footer takes full width
        alignItems: 'center', // Center the buttons horizontally
    },
    button: {
        backgroundColor: '#007bff',
        padding: 12,
        borderRadius: 5,
        marginBottom: 10,
        width: '80%', // Adjust width to make the buttons not full width
        alignItems: 'center', // Center button content horizontally
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
});
