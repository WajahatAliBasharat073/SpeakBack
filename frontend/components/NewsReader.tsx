import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Newspaper, ChevronRight } from 'lucide-react-native';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
}

interface NewsReaderProps {
    items: NewsItem[];
}

export default function NewsReader({ items }: NewsReaderProps) {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Newspaper color="#3b9eff" size={24} />
                <Text style={styles.title}>DAILY NEWS</Text>
            </View>

            {items.map((item) => (
                <View key={item.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSummary}>{item.summary}</Text>
                    <View style={styles.cardFooter}>
                        <Text style={styles.readMore}>Tap to read more</Text>
                        <ChevronRight color="#3b9eff" size={16} />
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    title: {
        fontSize: 14,
        fontWeight: '900',
        color: '#6b8099',
        letterSpacing: 2,
    },
    card: {
        backgroundColor: '#1a1d21',
        borderRadius: 24,
        padding: 24,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#2a2d31',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 10,
    },
    cardSummary: {
        fontSize: 18,
        color: '#b0bccd',
        lineHeight: 26,
        marginBottom: 15,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 5,
    },
    readMore: {
        color: '#3b9eff',
        fontSize: 14,
        fontWeight: '700',
    },
});
