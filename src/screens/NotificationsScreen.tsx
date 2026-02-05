import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { THEME } from '../theme/theme';
import { H1, H2, H3, Body, BodySmall, Caption } from '../components/Typography';
import { Icon } from '../components/Icon';
import GlassCard from '../components/GlassCard';
import { NotificationService, Notification } from '../services/NotificationService';

export const NotificationsScreen = ({ navigation }: any) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadNotifications = async () => {
        setIsRefreshing(true);
        // Ensure service is initialized if not already
        await NotificationService.init();
        setNotifications(NotificationService.getNotifications());
        setIsRefreshing(false);
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const clearAll = async () => {
        await NotificationService.clearAll();
        setNotifications([]);
    };

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'transaction': return 'wallet';
            case 'security': return 'shield';
            default: return 'settings';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.text} />
                </TouchableOpacity>
                <H2 style={styles.headerTitle}>Notifications</H2>
                <TouchableOpacity onPress={clearAll}>
                    <Icon name="trash" size={20} color={THEME.colors.error} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={loadNotifications} tintColor={THEME.colors.primary} />
                }
            >
                {notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="history" size={60} color={THEME.colors.border} />
                        <BodySmall style={{ marginTop: 16 }} color={THEME.colors.textSecondary}>
                            Your notification logs are clear
                        </BodySmall>
                    </View>
                ) : (
                    notifications.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.7}
                            onPress={() => {
                                if (item.type === 'transaction' && item.data?.hash) {
                                    navigation.navigate('TransactionDetails', { txHash: item.data.hash });
                                }
                            }}
                        >
                            <GlassCard style={styles.notificationCard}>
                                <View style={styles.iconContainer}>
                                    <Icon name={getTypeIcon(item.type)} size={20} color={THEME.colors.primary} />
                                </View>
                                <View style={styles.textContent}>
                                    <View style={styles.cardHeader}>
                                        <H3 style={{ flex: 1 }}>{item.title}</H3>
                                        <Caption color={THEME.colors.textSecondary}>
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Caption>
                                    </View>
                                    <BodySmall color={THEME.colors.textSecondary} style={{ marginTop: 4 }}>
                                        {item.message}
                                    </BodySmall>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
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
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingHorizontal: THEME.spacing.lg,
        paddingBottom: THEME.spacing.xxl,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: THEME.spacing.md,
        marginBottom: THEME.spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(230, 194, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    textContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    }
});
