import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { User, Languages, Heart } from 'lucide-react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface ProfileSetupProps {
    userId: string;
    onComplete: (profile: { name: string; language: string; interests: string }) => void;
}

export default function ProfileSetup({ userId, onComplete }: ProfileSetupProps) {
    const [language, setLanguage] = useState('English');
    const [interests, setInterests] = useState('');
    const [saving, setSaving] = useState(false);

    const languages = ['English', 'Spanish', 'Urdu', 'French', 'German'];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Welcome to SpeakBack</Text>
            <Text style={styles.subtitle}>Let's personalize your therapy experience.</Text>

            <View style={styles.field}>
                <View style={styles.labelContainer}>
                    <Languages size={20} color="#3b9eff" />
                    <Text style={styles.label}>Primary Language</Text>
                </View>
                <View style={styles.langGrid}>
                    {languages.map((lang) => (
                        <TouchableOpacity
                            key={lang}
                            onPress={() => setLanguage(lang)}
                            style={[styles.langButton, language === lang && styles.langButtonActive]}
                        >
                            <Text style={[styles.langText, language === lang && styles.langTextActive]}>{lang}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.field}>
                <View style={styles.labelContainer}>
                    <Heart size={20} color="#3b9eff" />
                    <Text style={styles.label}>What do you enjoy talking about? (Optional)</Text>
                </View>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Hobbies, family, pets, travel..."
                    placeholderTextColor="#6b8099"
                    value={interests}
                    onChangeText={setInterests}
                    multiline
                />
            </View>

            <TouchableOpacity
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={async () => {
                    if (saving) return;
                    setSaving(true);
                    try {
                        const profileData = {
                            language,
                            interests,
                            profileCompleted: true,
                            updatedAt: new Date().toISOString()
                        };

                        // Save to Firestore
                        await setDoc(doc(db, "users", userId), profileData, { merge: true });

                        onComplete({ name: '', ...profileData }); // Name is already in Firestore
                    } catch (error: any) {
                        Alert.alert("Error Saving Profile", error.message);
                    } finally {
                        setSaving(false);
                    }
                }}
                disabled={saving}
            >
                {saving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>START THERAPY</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 30,
        paddingTop: 60,
        backgroundColor: '#0a0d10',
        flexGrow: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b8099',
        marginBottom: 40,
    },
    field: {
        marginBottom: 30,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 10,
    },
    input: {
        backgroundColor: '#1a1d21',
        borderRadius: 16,
        padding: 20,
        color: '#fff',
        fontSize: 18,
        borderWidth: 1,
        borderColor: '#2a2d31',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    langGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    langButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#1a1d21',
        borderWidth: 1,
        borderColor: '#2a2d31',
    },
    langButtonActive: {
        backgroundColor: '#3b9eff',
        borderColor: '#3b9eff',
    },
    langText: {
        color: '#6b8099',
        fontSize: 16,
        fontWeight: '600',
    },
    langTextActive: {
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#3b9eff',
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#3b9eff',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    submitButtonDisabled: {
        opacity: 0.5,
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 2,
    },
});
