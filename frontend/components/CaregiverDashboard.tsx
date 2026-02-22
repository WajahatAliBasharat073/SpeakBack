import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { History, TrendingUp, User, ChevronRight, MessageSquare } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

// Mock data for initial UI build
const MOCK_SESSIONS = [
    {
        id: '1',
        date: 'Feb 21, 2026',
        duration: '12m',
        summary: 'Patient successfully named 4 out of 5 household objects. Showing slight improvement in phonetic retrieval for words starting with "B".',
        successRate: 0.8,
    },
    {
        id: '2',
        date: 'Feb 20, 2026',
        duration: '15m',
        summary: 'Focus on family names. Patient required multiple cues for "Daughter". Severe anomia present.',
        successRate: 0.4,
    }
];

interface CaregiverDashboardProps {
    onBack: () => void;
}

export default function CaregiverDashboard({ onBack }: CaregiverDashboardProps) {
    const [sessions, setSessions] = useState(MOCK_SESSIONS);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.dashHeader}>
                <TouchableOpacity onPress={onBack} style={styles.backBtnHeader}>
                    <ChevronRight color="#3b9eff" size={24} style={{ transform: [{ rotate: '180deg' }] }} />
                    <Text style={styles.backBtnText}>PATIENT MENU</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <TrendingUp color="#2dcc8f" size={24} />
                    <Text style={styles.statValue}>+12%</Text>
                    <Text style={styles.statLabel}>Success Rate</Text>
                </View>
                <View style={styles.statCard}>
                    <History color="#3b9eff" size={24} />
                    <Text style={styles.statValue}>82</Text>
                    <Text style={styles.statLabel}>Minutes Total</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Sessions</Text>

            {sessions.map((session, index) => (
                <Animated.View
                    key={session.id}
                    entering={FadeInUp.delay(index * 100)}
                    style={styles.sessionCard}
                >
                    <View style={styles.sessionHeader}>
                        <View>
                            <Text style={styles.sessionDate}>{session.date}</Text>
                            <Text style={styles.sessionDuration}>{session.duration} session</Text>
                        </View>
                        <View style={[styles.successBadge, { backgroundColor: session.successRate > 0.5 ? 'rgba(45, 204, 143, 0.1)' : 'rgba(255, 91, 91, 0.1)' }]}>
                            <Text style={[styles.successText, { color: session.successRate > 0.5 ? '#2dcc8f' : '#ff5b5b' }]}>
                                {Math.round(session.successRate * 100)}% Success
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryBox}>
                        <MessageSquare color="#6b8099" size={16} />
                        <Text style={styles.summaryText} numberOfLines={3}>{session.summary}</Text>
                    </View>

                    <TouchableOpacity style={styles.viewDetails}>
                        <Text style={styles.viewDetailsText}>View Full Transcript</Text>
                        <ChevronRight color="#3b9eff" size={16} />
                    </TouchableOpacity>
                </Animated.View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(59, 158, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(59, 158, 255, 0.1)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginTop: 8,
    },
    statLabel: {
        color: '#6b8099',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    sessionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    sessionDate: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    sessionDuration: {
        color: '#6b8099',
        fontSize: 12,
        marginTop: 2,
    },
    successBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    successText: {
        fontSize: 10,
        fontWeight: '700',
    },
    summaryBox: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        padding: 12,
        borderRadius: 12,
    },
    summaryText: {
        flex: 1,
        color: '#e2eaf4',
        fontSize: 13,
        lineHeight: 18,
    },
    viewDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    viewDetailsText: {
        color: '#3b9eff',
        fontSize: 13,
        fontWeight: '600',
        marginRight: 4,
    },
    dashHeader: {
        marginBottom: 20,
    },
    backBtnHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backBtnText: {
        color: '#3b9eff',
        fontSize: 14,
        fontWeight: '800',
    }
});
