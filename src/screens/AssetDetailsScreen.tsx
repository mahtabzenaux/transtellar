import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { THEME } from '../theme/theme';
import { H1, H2, H3, Body, BodySmall, Caption } from '../components/Typography';
import { Icon } from '../components/Icon';
import GlassCard from '../components/GlassCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '../services/StorageService';
import { WalletService } from '../services/WalletService';
import { MarketService } from '../services/data/MarketService';
import { HistoryService } from '../services/data/HistoryService';
import { DatabaseService } from '../services/data/DatabaseService';
import { ChartPoint, Transaction } from '../services/data/types';
import { useAuth } from '../store/AuthContext';
import { formatBalance } from '../utils/formatters';
import { RefreshControl } from 'react-native';

export const AssetDetailsScreen = ({ route, navigation }: any) => {
    const { asset } = route.params;
    const { activeWallet } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingChart, setLoadingChart] = useState(false);

    useEffect(() => {
        setTransactions([]); // Clear state immediately on wallet switch
        loadHistory();
        loadChart();
    }, [activeWallet]);

    const loadHistory = async (forceRefresh: boolean = false) => {
        if (!activeWallet) return;
        setLoadingHistory(true);
        try {
            const chainId = WalletService.getChainId();

            // 1. Load from cache first for speed
            const cached = await DatabaseService.getTransactions(activeWallet.address, chainId);
            const initialFilter = cached.filter(tx => {
                if (asset.type === 'native') return true;
                if (asset.type === 'erc20' && asset.address) {
                    return (tx as any).tokenAddress?.toLowerCase() === asset.address.toLowerCase();
                }
                return false;
            });
            setTransactions(initialFilter);

            // 2. Fetch fresh data from Moralis (HistoryService)
            let freshResults: Transaction[] = [];
            if (asset.type === 'native') {
                const data = await HistoryService.fetchTransactions(activeWallet.address, chainId);
                freshResults = data.results;
            } else {
                const data = await HistoryService.fetchTokenTransfers(activeWallet.address, chainId);
                freshResults = data.results;
            }

            if (freshResults.length > 0) {
                // Update DatabaseService to save the new high-precision strings
                await DatabaseService.saveTransactions(activeWallet.address, chainId, freshResults);

                // Re-filter and update UI
                const finalFiltered = freshResults.filter(tx => {
                    if (asset.type === 'native') return true;
                    if (asset.type === 'erc20' && asset.address) {
                        return (tx as any).tokenAddress?.toLowerCase() === asset.address.toLowerCase();
                    }
                    return false;
                });
                setTransactions(finalFiltered);
            }
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadChart = async () => {
        setLoadingChart(true);
        try {
            const data = await MarketService.fetchHistory(asset.symbol, asset.address, WalletService.getChainId());
            setChartData(data);
        } catch (error) {
            console.error('Failed to load chart', error);
        } finally {
            setLoadingChart(false);
        }
    };

    const handleTransactionPress = (tx: any) => {
        navigation.navigate('TransactionDetails', { txHash: tx.hash });
    };

    const renderTransactionItem = (tx: any) => {
        const isReceived = tx.to?.toLowerCase() === activeWallet?.address.toLowerCase();
        const date = new Date(tx.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

        return (
            <TouchableOpacity key={tx.hash} onPress={() => handleTransactionPress(tx)}>
                <GlassCard style={styles.txCard}>
                    <View style={styles.txIcon}>
                        <Icon
                            name={isReceived ? "receive" : "arrow-up-right"}
                            size={20}
                            color={isReceived ? THEME.colors.success : THEME.colors.error}
                        />
                    </View>
                    <View style={styles.txContent}>
                        <View style={styles.txHeader}>
                            <Body style={styles.txTitle}>{isReceived ? 'Received' : 'Sent'}</Body>
                            <Body style={[
                                styles.txAmount,
                                { color: isReceived ? THEME.colors.success : THEME.colors.text }
                            ]}>
                                {isReceived ? '+' : '-'}{formatBalance(tx.value)} {asset.symbol}
                            </Body>
                        </View>
                        <View style={styles.txFooter}>
                            <Caption color={THEME.colors.textSecondary}>{date} • {tx.status}</Caption>
                        </View>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.text} />
                </TouchableOpacity>
                <H2 style={styles.headerTitle}>{asset.symbol} Details</H2>
                <TouchableOpacity onPress={() => navigation.navigate('Send', { asset })}>
                    <Icon name="send" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loadingHistory}
                        onRefresh={() => {
                            loadHistory(true);
                            loadChart();
                        }}
                        tintColor={THEME.colors.primary}
                    />
                }
            >
                <View style={styles.balanceCard}>
                    <Caption style={{ marginBottom: 8 }}>Total Balance</Caption>
                    <H1 style={{ fontSize: 48 }}>{formatBalance(asset.balance)} {asset.symbol}</H1>
                    <View style={styles.fiatRow}>
                        <H3 color={THEME.colors.textSecondary}>≈ ${parseFloat(asset.valueFiat).toLocaleString()}</H3>
                        {loadingChart ? (
                            <ActivityIndicator size="small" color={THEME.colors.primary} style={{ marginLeft: 8 }} />
                        ) : null}
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Send', { asset })}>
                        <View style={styles.iconCircle}>
                            <Icon name="arrow-up-right" size={24} color={THEME.colors.primary} />
                        </View>
                        <BodySmall>Send</BodySmall>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Receive', { asset })}>
                        <View style={styles.iconCircle}>
                            <Icon name="receive" size={24} color={THEME.colors.primary} />
                        </View>
                        <BodySmall>Receive</BodySmall>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Swap')}>
                        <View style={styles.iconCircle}>
                            <Icon name="refresh" size={24} color={THEME.colors.primary} />
                        </View>
                        <BodySmall>Swap</BodySmall>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <H3 style={styles.sectionTitle}>Asset Information</H3>
                    <GlassCard style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <BodySmall color={THEME.colors.textSecondary}>Contract Address</BodySmall>
                            <Body style={styles.addressText}>{asset.address ? `${asset.address.slice(0, 6)}...${asset.address.slice(-4)}` : 'Native'}</Body>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <BodySmall color={THEME.colors.textSecondary}>Decimals</BodySmall>
                            <Body>18</Body>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <BodySmall color={THEME.colors.textSecondary}>Network</BodySmall>
                            <Body>Ethereum Mainnet</Body>
                        </View>
                    </GlassCard>
                </View>

                <View style={styles.section}>
                    <H3 style={styles.sectionTitle}>Recent Transactions</H3>
                    {transactions.length > 0 ? (
                        transactions.map(renderTransactionItem)
                    ) : (
                        <GlassCard style={styles.emptyCard}>
                            <Icon name="history" size={40} color={THEME.colors.border} />
                            <BodySmall style={{ marginTop: 12 }}>No recent {asset.symbol} movements</BodySmall>
                        </GlassCard>
                    )}
                </View>
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
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: THEME.spacing.lg,
        paddingBottom: THEME.spacing.xxl,
    },
    balanceCard: {
        alignItems: 'center',
        marginVertical: THEME.spacing.xxl,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginBottom: THEME.spacing.xxl,
    },
    actionBtn: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: THEME.colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    section: {
        marginBottom: THEME.spacing.xl,
    },
    sectionTitle: {
        marginBottom: THEME.spacing.md,
    },
    infoCard: {
        padding: THEME.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: THEME.spacing.sm,
    },
    addressText: {
        fontFamily: 'Ariel',
    },
    divider: {
        height: 1,
        backgroundColor: THEME.colors.border,
    },
    emptyCard: {
        padding: THEME.spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    txCard: {
        flexDirection: 'row',
        padding: THEME.spacing.md,
        marginBottom: THEME.spacing.sm,
        alignItems: 'center',
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    txContent: {
        flex: 1,
    },
    txHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    txTitle: {
        fontWeight: '600',
    },
    txAmount: {
        fontWeight: '600',
    },
    txFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    fiatRow: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
