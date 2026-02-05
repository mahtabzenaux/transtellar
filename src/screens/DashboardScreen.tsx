import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, FlatList, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../theme/theme';
import { H1, H2, H3, Body, BodySmall, Caption } from '../components/Typography';
import GlassCard from '../components/GlassCard';
import { GothicButton } from '../components/GothicButton';
import { Icon } from '../components/Icon';
import { WalletService, NETWORKS } from '../services/WalletService';
import { TokenService, TokenAsset } from '../services/TokenService';
import { MarketService } from '../services/data/MarketService';
import { HistoryService } from '../services/data/HistoryService';
import { DatabaseService } from '../services/data/DatabaseService';
import { AssetPrice, Transaction } from '../services/data/types';
import { useAuth } from '../store/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/types';
import { formatBalance } from '../utils/formatters';

type DashboardScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Dashboard'>;

interface Props {
    navigation: DashboardScreenNavigationProp;
}

export const DashboardScreen = ({ navigation }: Props) => {
    const { activeWallet } = useAuth();
    const [balance, setBalance] = useState('0.00');
    const [tokens, setTokens] = useState<TokenAsset[]>([]);
    const [prices, setPrices] = useState<Record<string, AssetPrice>>({});
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'assets' | 'transactions'>('assets');
    const [chainId, setChainId] = useState(WalletService.getChainId());

    const scrollY = React.useRef(new Animated.Value(0)).current;

    const currentNetwork = useMemo(() => {
        return Object.values(NETWORKS).find(n => n.chainId === chainId) || NETWORKS.sepolia;
    }, [chainId]);

    useEffect(() => {
        if (activeWallet) {
            setBalance('0.00');
            setTokens([]);
            setTransactions([]);
            loadWalletInfo();
        }
    }, [activeWallet]);

    useFocusEffect(
        useCallback(() => {
            const nextChainId = WalletService.getChainId();
            if (nextChainId !== chainId) {
                setChainId(nextChainId);
                setBalance('0.00');
                setTokens([]);
                setTransactions([]);
            }
            loadWalletInfo();
        }, [chainId, activeWallet])
    );

    const loadWalletInfo = async () => {
        if (!activeWallet) return;
        try {
            const currentChainId = WalletService.getChainId();
            const [ethBal, tokenAssets] = await Promise.all([
                WalletService.getBalance(),
                TokenService.fetchTokenBalances(activeWallet.address, currentChainId),
            ]);

            // Load and merge history from DatabaseService
            const cached = await DatabaseService.getTransactions(activeWallet.address, currentChainId);
            setTransactions(cached);

            // Fetch fresh data in the background
            const [nativeData, tokenData] = await Promise.all([
                HistoryService.fetchTransactions(activeWallet.address, currentChainId),
                HistoryService.fetchTokenTransfers(activeWallet.address, currentChainId),
            ]);

            const newTxs = [...nativeData.results, ...tokenData.results];

            // Prevent duplicates using hash map and filter out null hashes
            const txMap = new Map(cached.map(tx => [tx.hash, tx]));
            newTxs.filter(tx => tx && tx.hash).forEach(tx => txMap.set(tx.hash, tx));

            const merged = Array.from(txMap.values()).sort((a, b) => b.timestamp - a.timestamp);

            if (merged.length > 0) {
                await DatabaseService.saveTransactions(activeWallet.address, currentChainId, merged);
                setTransactions(merged);
            }

            // Fetch prices
            const assetsToPrice = [
                { symbol: currentNetwork.symbol, address: undefined, chainId: currentChainId },
                ...tokenAssets.map(t => ({ symbol: t.symbol, address: t.address, chainId: currentChainId }))
            ];
            const fetchedPrices = await MarketService.fetchMultiPrices(assetsToPrice);
            const priceMap = fetchedPrices.reduce((acc, p) => ({ ...acc, [p.symbol]: p }), {});

            setBalance(ethBal);
            setTokens(tokenAssets);
            setPrices(priceMap);
        } catch (error) {
            console.error('Failed to load wallet info:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadWalletInfo();
        setIsRefreshing(false);
    };

    const renderAssetItem = ({ item, index }: { item: any, index: number }) => {
        const isNative = item.type === 'native';
        const symbol = isNative ? currentNetwork.symbol : item.symbol;
        const name = isNative ? currentNetwork.name : item.name;
        const priceInfo = prices[symbol];

        return (
            <TouchableOpacity
                style={styles.assetItem}
                onPress={() => navigation.navigate('AssetDetails', {
                    asset: { ...item, id: isNative ? 'native' : item.address, valueFiat: '0.00' }
                })}
            >
                <GlassCard style={styles.assetCard}>
                    <View style={[styles.assetIcon, isNative && { backgroundColor: 'rgba(230, 194, 0, 0.1)' }]}>
                        <Icon name={isNative ? "wallet" : "shield"} size={20} color={isNative ? THEME.colors.primary : THEME.colors.textSecondary} />
                    </View>
                    <View style={styles.assetDetails}>
                        <Body style={styles.boldText}>{name}</Body>
                        <Caption>{symbol}</Caption>
                    </View>
                    <View style={styles.assetBalance}>
                        <Body style={styles.boldText}>{formatBalance(item.balance)}</Body>
                        {priceInfo && (
                            <Caption style={priceInfo.change24h < 0 ? { color: THEME.colors.error } : { color: THEME.colors.success }}>
                                {priceInfo.change24h > 0 ? '+' : ''}{priceInfo.change24h.toFixed(2)}%
                            </Caption>
                        )}
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    const renderTransactionItem = ({ item }: { item: Transaction }) => {
        const isOutgoing = item.from.toLowerCase() === activeWallet?.address.toLowerCase();
        const date = new Date(item.timestamp).toLocaleDateString();

        return (
            <TouchableOpacity
                style={styles.txItem}
                onPress={() => navigation.navigate('TransactionDetails', { txHash: item.hash })}
            >
                <View style={[styles.txIcon, { backgroundColor: isOutgoing ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 255, 0, 0.05)' }]}>
                    <Icon
                        name={isOutgoing ? "arrow-up-right" : "arrow-down-left"}
                        size={18}
                        color={isOutgoing ? THEME.colors.error : THEME.colors.success}
                    />
                </View>
                <View style={styles.txInfo}>
                    <Body style={styles.boldText}>{isOutgoing ? 'Sent' : 'Received'}</Body>
                    <Caption>{date} • {item.status.toUpperCase()}</Caption>
                </View>
                <View style={styles.txValue}>
                    <Body style={[styles.boldText, { color: isOutgoing ? THEME.colors.text : THEME.colors.success }]}>
                        {isOutgoing ? '-' : '+'}{formatBalance(item.value)}
                    </Body>
                    <Caption>{currentNetwork.symbol}</Caption>
                </View>
            </TouchableOpacity>
        );
    };

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [0, -100],
        extrapolate: 'clamp',
    });

    const heroOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const assetsData = [
        { type: 'native', balance, symbol: currentNetwork.symbol, name: currentNetwork.name },
        ...tokens
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Animated.View style={[styles.stickySection, { transform: [{ translateY: headerTranslateY }] }]}>
                {/* Header Actions */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.networkSelector}
                        onPress={() => navigation.navigate('NetworkSelector')}
                    >
                        <View style={styles.networkDot} />
                        <Caption style={styles.networkName}>{currentNetwork.name}</Caption>
                        <Icon name="arrow-right" size={12} color={THEME.colors.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.headerBtn}>
                            <Icon name="history" size={24} color={THEME.colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('SecuritySettings')} style={styles.headerBtn}>
                            <Icon name="shield" size={24} color={THEME.colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('WalletManager')} style={styles.headerBtn}>
                            <Icon name="settings" size={24} color={THEME.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hero Section - Non-scrolling until pushed up */}
                <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
                    <Caption style={styles.walletName}>{activeWallet?.name.toUpperCase()}</Caption>
                    <H1 style={styles.balanceText}>{formatBalance(balance)} {currentNetwork.symbol}</H1>
                    <H3 style={styles.fiatTotal}>
                        ${(parseFloat(balance) * (prices[currentNetwork.symbol]?.priceUsd || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </H3>
                    <TouchableOpacity style={styles.addressCopy}>
                        <BodySmall style={styles.addressText}>
                            {activeWallet ? `${activeWallet.address.slice(0, 6)}...${activeWallet.address.slice(-4)}` : '0x00...0000'}
                        </BodySmall>
                        <Icon name="copy" size={12} color={THEME.colors.primary} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Primary Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('Send', {
                            asset: {
                                id: 'native',
                                symbol: currentNetwork.symbol,
                                name: currentNetwork.name,
                                balance,
                                valueFiat: '0.00',
                                type: 'native'
                            }
                        })}
                    >
                        <View style={styles.actionIconContainer}>
                            <Icon name="send" size={24} color={THEME.colors.primary} />
                        </View>
                        <Caption style={styles.actionLabel}>SEND</Caption>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('Receive')}
                    >
                        <View style={[styles.actionIconContainer, styles.actionIconOutline]}>
                            <Icon name="receive" size={24} color={THEME.colors.primary} />
                        </View>
                        <Caption style={styles.actionLabel}>RECEIVE</Caption>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('DAppBrowser', {})}
                    >
                        <View style={[styles.actionIconContainer, styles.actionIconOutline]}>
                            <Icon name="search" size={24} color={THEME.colors.primary} />
                        </View>
                        <Caption style={styles.actionLabel}>BROWSER</Caption>
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'assets' && styles.activeTab]}
                        onPress={() => setActiveTab('assets')}
                    >
                        <H3 style={[styles.tabText, activeTab === 'assets' && styles.activeTabText]}>ASSETS</H3>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
                        onPress={() => setActiveTab('transactions')}
                    >
                        <H3 style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>RECORDS</H3>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <Animated.FlatList
                data={(activeTab === 'assets' ? assetsData : transactions) as any[]}
                renderItem={activeTab === 'assets' ? renderAssetItem : renderTransactionItem}
                keyExtractor={(item: any, index: number) => index.toString()}
                contentContainerStyle={styles.scrollList}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={THEME.colors.primary}
                        progressViewOffset={400}
                    />
                }
                ListFooterComponent={() => (
                    activeTab === 'assets' ? (
                        <GothicButton
                            title="Add Token"
                            variant="ghost"
                            icon="plus"
                            onPress={() => navigation.navigate('AddToken')}
                            style={styles.addBtn}
                        />
                    ) : null
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Icon name="search" size={48} color={THEME.colors.surfaceLight} />
                        <Body style={styles.emptyText}>Nothing found in the void.</Body>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    stickySection: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: THEME.colors.background,
        paddingHorizontal: THEME.spacing.lg,
        paddingTop: THEME.spacing.md,
    },
    scrollList: {
        paddingTop: 450, // Space for sticky section
        paddingHorizontal: THEME.spacing.lg,
        paddingBottom: THEME.spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.md,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerBtn: {
        marginLeft: THEME.spacing.md,
    },
    networkSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.surface,
        paddingHorizontal: THEME.spacing.md,
        paddingVertical: THEME.spacing.xs,
        borderRadius: THEME.radius.full,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    networkDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: THEME.colors.success,
        marginRight: THEME.spacing.sm,
    },
    networkName: {
        marginRight: THEME.spacing.xs,
        fontWeight: '600',
    },
    hero: {
        alignItems: 'center',
        marginVertical: THEME.spacing.xl,
    },
    walletName: {
        letterSpacing: 3,
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.xs,
    },
    balanceText: {
        fontSize: 40,
        lineHeight: 48,
        color: THEME.colors.primary,
        fontFamily: THEME.typography.fonts.heading,
        fontWeight: '700',
    },
    fiatTotal: {
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.sm,
        opacity: 0.8,
    },
    addressCopy: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.surface,
        paddingHorizontal: THEME.spacing.md,
        paddingVertical: THEME.spacing.xs,
        borderRadius: THEME.radius.md,
        marginTop: THEME.spacing.sm,
    },
    addressText: {
        color: THEME.colors.textSecondary,
        marginRight: THEME.spacing.sm,
        fontFamily: 'monospace',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: THEME.spacing.lg,
        paddingHorizontal: THEME.spacing.md,
    },
    actionBtn: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(230, 194, 0, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: THEME.spacing.xs,
        borderWidth: 1,
        borderColor: 'rgba(230, 194, 0, 0.3)',
    },
    actionIconOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(230, 194, 0, 0.3)',
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        color: THEME.colors.textSecondary,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: THEME.colors.border,
        marginBottom: THEME.spacing.md,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: THEME.spacing.md,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderColor: THEME.colors.primary,
    },
    tabText: {
        color: THEME.colors.textSecondary,
        letterSpacing: 2,
    },
    activeTabText: {
        color: THEME.colors.primary,
    },
    assetItem: {
        marginBottom: THEME.spacing.sm,
    },
    assetCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: THEME.spacing.md,
    },
    assetIcon: {
        width: 44,
        height: 44,
        borderRadius: THEME.radius.md,
        backgroundColor: THEME.colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    assetDetails: {
        flex: 1,
    },
    assetBalance: {
        alignItems: 'flex-end',
    },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: THEME.spacing.md,
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.md,
        marginBottom: THEME.spacing.sm,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: THEME.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    txInfo: {
        flex: 1,
    },
    txValue: {
        alignItems: 'flex-end',
    },
    boldText: {
        fontWeight: '600',
    },
    addBtn: {
        marginTop: THEME.spacing.md,
    },
    emptyContainer: {
        padding: THEME.spacing.xxl,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: THEME.spacing.md,
        color: THEME.colors.textSecondary,
    },
});
