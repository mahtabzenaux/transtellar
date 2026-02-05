import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, Body, Caption } from '../components/Typography';
import { Icon } from '../components/Icon';
import GlassCard from '../components/GlassCard';
import { SafeAreaView } from 'react-native-safe-area-context';

export const SwapScreen = ({ navigation }: any) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.text} />
                </TouchableOpacity>
                <H2 style={styles.headerTitle}>Swap Tokens</H2>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <GlassCard style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Icon name="refresh" size={64} color={THEME.colors.primary} />
                    </View>
                    <H2 style={styles.title}>Coming Soon</H2>
                    <Body style={styles.description}>
                        We are working hard to bring you the best decentralized exchange experience. Stay tuned!
                    </Body>

                    <View style={styles.tagsContainer}>
                        <View style={styles.tag}>
                            <Body style={styles.tagText}>Best Rates</Body>
                        </View>
                        <View style={styles.tag}>
                            <Body style={styles.tagText}>Multi-Chain</Body>
                        </View>
                        <View style={styles.tag}>
                            <Body style={styles.tagText}>Low Fees</Body>
                        </View>
                    </View>
                </GlassCard>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: THEME.spacing.lg,
        paddingVertical: THEME.spacing.lg,
    },
    headerTitle: {
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: THEME.spacing.lg,
    },
    card: {
        alignItems: 'center',
        padding: THEME.spacing.xxl,
    },
    iconContainer: {
        marginBottom: THEME.spacing.xl,
        backgroundColor: 'rgba(230, 194, 0, 0.1)',
        padding: THEME.spacing.xl,
        borderRadius: THEME.radius.full,
    },
    title: {
        marginBottom: THEME.spacing.md,
        letterSpacing: 1,
    },
    description: {
        textAlign: 'center',
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.xl,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: THEME.spacing.md,
    },
    tag: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: THEME.spacing.xs,
        paddingHorizontal: THEME.spacing.md,
        borderRadius: THEME.radius.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    tagText: {
        fontSize: 12,
        color: THEME.colors.primary,
    }
});
