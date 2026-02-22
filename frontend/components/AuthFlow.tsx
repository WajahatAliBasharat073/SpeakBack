import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Dimensions, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { LogIn, UserPlus, Key, ArrowLeft } from 'lucide-react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const logoImg = require('../assets/logo.png');

const { width } = Dimensions.get('window');

type AuthMode = 'login' | 'signup' | 'forgot';

interface AuthFlowProps {
    onAuthSuccess: (user: any) => void;
}

export default function AuthFlow({ onAuthSuccess }: AuthFlowProps) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('English');
    const [interests, setInterests] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email || !password) {
            return Alert.alert('Error', 'Please enter both email and password.');
        }
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            onAuthSuccess(userCredential.user);
        } catch (error: any) {
            Alert.alert('Sign In Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            return Alert.alert('Error', 'Please fill in all fields.');
        }
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            // Create a user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: user.email,
                language: language,
                interests: interests,
                profileCompleted: true,
                createdAt: new Date()
            });
            onAuthSuccess(user);
        } catch (error: any) {
            Alert.alert('Sign Up Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            return Alert.alert('Error', 'Please enter your email address.');
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert('Check Your Email', 'A password reset link has been sent to your email address.');
            setMode('login');
        } catch (error: any) {
            Alert.alert('Password Reset Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderLogin = () => (
        <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your therapy</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.forgotLink} onPress={() => setMode('forgot')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} disabled={loading}>
                <LogIn color="#fff" size={24} style={{ marginRight: 10 }} />
                <Text style={styles.primaryButtonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => setMode('signup')}>
                    <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSignup = () => (
        <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join SpeakBack today</Text>

            <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Text style={styles.fieldLabel}>Primary Language</Text>
            <View style={styles.langGrid}>
                {['English', 'Spanish', 'Urdu', 'French', 'German'].map((lang) => (
                    <TouchableOpacity
                        key={lang}
                        onPress={() => setLanguage(lang)}
                        style={[styles.langButton, language === lang && styles.langButtonActive]}
                    >
                        <Text style={[styles.langText, language === lang && styles.langTextActive]}>{lang}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TextInput
                style={[styles.input, { height: 80, marginTop: 15 }]}
                placeholder="What do you want to talk about? (e.g. hobbies, family)"
                placeholderTextColor="#999"
                value={interests}
                onChangeText={setInterests}
                multiline
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} disabled={loading}>
                <UserPlus color="#fff" size={24} style={{ marginRight: 10 }} />
                <Text style={styles.primaryButtonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => setMode('login')}>
                    <Text style={styles.linkText}>Log In</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderForgot = () => (
        <View style={styles.formContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => setMode('login')}>
                <ArrowLeft color="#008080" size={24} />
            </TouchableOpacity>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handlePasswordReset} disabled={loading}>
                <Key color="#fff" size={24} style={{ marginRight: 10 }} />
                <Text style={styles.primaryButtonText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <View style={styles.header}>
                    <Image
                        source={logoImg}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.brandName}>SpeakBack</Text>
                </View>

                {mode === 'login' && renderLogin()}
                {mode === 'signup' && renderSignup()}
                {mode === 'forgot' && renderForgot()}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    flex: {
        flex: 1,
        padding: 20,
        justifyContent: 'center'
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoImage: {
        width: 100,
        height: 100,
        marginBottom: 10,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#008080',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    logoText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    brandName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#333',
        marginTop: 15,
    },
    formContainer: {
        width: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    input: {
        height: 60,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 20,
        fontSize: 18,
        color: '#333',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    forgotLink: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotText: {
        color: '#008080',
        fontWeight: '600',
    },
    primaryButton: {
        height: 60,
        backgroundColor: '#008080',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#008080',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: '#666',
        fontSize: 16,
    },
    linkText: {
        color: '#008080',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
        marginTop: 5,
    },
    langGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    langButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#eee',
    },
    langButtonActive: {
        backgroundColor: '#008080',
        borderColor: '#008080',
    },
    langText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    langTextActive: {
        color: '#fff',
    },
});
