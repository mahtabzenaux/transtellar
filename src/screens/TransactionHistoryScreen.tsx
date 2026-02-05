import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, Body, BodySmall, Caption } from '../components/Typography';
import GlassCard from '../components/GlassCard';
import { Icon } from '../components/Icon';
import { WalletService } from '../services/WalletService';
import { DatabaseService } from '../services/data/DatabaseService';
import { Transaction } from '../services/data/types';
import { useAuth } from '../store/AuthContext';



export const TransactionHistoryScreen = ({ navigation }: any) => {
    const { activeWallet } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const chainId = WalletService.getChainId();

    useEffect(() => {
        loadTransactions();
    }, [activeWallet, chainId]);

    const loadTransactions = async () => {
        if (!activeWallet) return;

        setIsLoading(true);
        try {
            const txs = await DatabaseService.getTransactions(activeWallet.address, chainId);
            setTransactions(txs);
            setIsLoading(false);

        } catch (error) {
            console.error('Failed to load transactions:', error);
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadTransactions();
        setIsRefreshing(false);
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const isSend = item.from.toLowerCase() === activeWallet?.address.toLowerCase();
        const typeLabel = item.type === 'token_transfer' ? 'Token' : (isSend ? 'Sent' : 'Received');
        const symbol = (item as any).tokenSymbol || 'ETH';

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('TransactionDetails', { txHash: item.hash })}
                activeOpacity={0.7}
            >
                <GlassCard style={styles.txItem}>
                    <View style={[styles.iconContainer, { backgroundColor: isSend ? 'rgba(230, 0, 0, 0.05)' : 'rgba(0, 200, 83, 0.05)' }]}>
                        <Icon
                            name={isSend ? 'send' : 'receive'}
                            size={20}
                            color={isSend ? THEME.colors.secondary : THEME.colors.success}
                        />
                    </View>

                    <View style={styles.txInfo}>
                        <Body style={styles.txAction}>{typeLabel} {item.type.split('_').join(' ')}</Body>
                        <Caption style={styles.txHash}>{item.hash.slice(0, 10)}...{item.hash.slice(-8)}</Caption>
                    </View>

                    <View style={styles.txDetails}>
                        <Body style={[styles.amountText, { color: isSend ? THEME.colors.secondary : THEME.colors.success }] as any}>
                            {isSend ? '-' : '+'}{item.value} {symbol}
                        </Body>
                        <BodySmall style={styles.txDate}>
                            {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </BodySmall>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Archives</H2>
            </View>

            {isLoading && transactions.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={THEME.colors.primary} />
                    <Caption style={styles.loadingText}>RETRIEVING RECORDS...</Caption>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.hash}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={THEME.colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Icon name="history" size={48} color={THEME.colors.textSecondary} strokeWidth={1} />
                            <Body style={styles.emptyText}>The archives are empty.</Body>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        padding: THEME.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: THEME.spacing.md,
    },
    list: {
        padding: THEME.spacing.lg,
        paddingBottom: THEME.spacing.xxl,
    },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: THEME.spacing.md,
        marginBottom: THEME.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: THEME.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    txInfo: {
        flex: 1,
    },
    txAction: {
        fontWeight: '700',
        marginBottom: 2,
    },
    txHash: {
        opacity: 0.6,
    },
    txDetails: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontWeight: '700',
        marginBottom: 2,
    },
    txDate: {
        fontSize: 10,
        color: THEME.colors.textSecondary,
        opacity: 0.8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: THEME.spacing.xl,
    },
    loadingText: {
        marginTop: THEME.spacing.md,
        letterSpacing: 2,
        color: THEME.colors.primary,
    },
    emptyText: {
        marginTop: THEME.spacing.md,
        color: THEME.colors.textSecondary,
        opacity: 0.7,
    },
});
