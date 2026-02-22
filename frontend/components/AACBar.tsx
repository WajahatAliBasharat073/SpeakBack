import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CupSoda, Users, AlertCircle, Home } from 'lucide-react-native';

interface AACBarProps {
    onPress: (need: string) => void;
}

export default function AACBar({ onPress }: AACBarProps) {
    const needs = [
        { label: 'Water', icon: CupSoda, color: '#3b9eff' },
        { label: 'Bathroom', icon: Home, color: '#4cc9f0' },
        { label: 'Pain', icon: AlertCircle, color: '#f72585' },
        { label: 'Help', icon: Users, color: '#7209b7' },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>I NEED:</Text>
            <View style={styles.grid}>
                {needs.map((item) => (
                    <TouchableOpacity
                        key={item.label}
                        style={[styles.button, { backgroundColor: item.color + '20', borderColor: item.color }]}
                        onPress={() => onPress(item.label)}
                    >
                        <item.icon size={32} color={item.color} />
                        <Text style={[styles.buttonText, { color: item.color }]}>{item.label.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#1a1d21',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderWidth: 1,
        borderColor: '#2a2d31',
    },
    title: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6b8099',
        letterSpacing: 2,
        marginBottom: 15,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    button: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    buttonText: {
        fontSize: 10,
        fontWeight: '800',
        marginTop: 8,
    },
});
