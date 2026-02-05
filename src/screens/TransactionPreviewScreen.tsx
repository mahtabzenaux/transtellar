import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../theme/theme';
import { H2, H3, Body, BodySmall, Caption } from '../components/Typography';
import GlassCard from '../components/GlassCard';
import { Icon } from '../components/Icon';
import { WalletService } from '../services/WalletService';
import { SwipeToConfirm } from '../components/SwipeToConfirm';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../navigation/types';
import { RouteProp } from '@react-navigation/native';
import { ethers } from 'ethers';
import { GothicButton } from '../components/GothicButton';
import { useAlert } from '../context/AlertContext';
import { formatBalance } from '../utils/formatters';
import { SecurityService } from '../services/SecurityService';

type PreviewScreenNavigationProp = StackNavigationProp<MainStackParamList, 'TransactionPreview'>;
type PreviewScreenRouteProp = RouteProp<MainStackParamList, 'TransactionPreview'>;

interface Props {
    navigation: PreviewScreenNavigationProp;
    route: PreviewScreenRouteProp;
}

export const TransactionPreviewScreen = ({ navigation, route }: Props) => {
    const { txData, asset, transferAmount } = route.params;
    const { showAlert } = useAlert();
    const [gasPrice, setGasPrice] = useState<bigint>(0n);
    const [gasLimit, setGasLimit] = useState<bigint>(21000n);
    const [ethBalance, setEthBalance] = useState<bigint>(0n);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const isToken = asset?.type === 'erc20';
    const amountStr = transferAmount || (isToken ? '0' : txData.value);
    const symbol = asset?.symbol || 'ETH';

    useEffect(() => {
        loadGasEstimates();
    }, []);

    const loadGasEstimates = async () => {
        try {
            const provider = WalletService.getProvider();
            const { gasPrice: price } = await provider.getFeeData();
            const bal = await WalletService.getBalance();

            let limit = 21000n;
            try {
                limit = await WalletService.estimateGas(txData.to, txData.value, txData.data);
            } catch (e) {
                console.warn('Gas estimation failed, using default', e);
                // For tokens, default might be higher
                if (isToken) limit = 65000n;
            }

            setGasPrice(price || 0n);
            setGasLimit(limit);
            setEthBalance(ethers.parseEther(bal));
        } catch (error) {
            console.error('Failed to load gas estimates', error);
        } finally {
            setIsLoading(false);
        }
    };

    const gasFee = gasPrice * gasLimit;
    // For Native: Cost is Value + Gas
    // For Token: Cost is Gas (Value is 0 ETH)
    const ethCost = (isToken ? 0n : ethers.parseEther(amountStr)) + gasFee;

    const hasInsufficientEth = ethCost > ethBalance;

    const handleConfirm = async () => {
        if (hasInsufficientEth) {
            showAlert('Insufficient Balance', `You do not have enough ETH to cover the ${isToken ? 'gas fee' : 'transaction cost'}.`);
            return;
        }

        // Production Security: Require re-authentication for signing
        const isAuthorized = await SecurityService.authenticateGlobally();
        if (!isAuthorized) return;

        setIsSending(true);
        try {
            const tx = await WalletService.sendTransaction(txData.to, txData.value, txData.data);
            if (tx) {
                showAlert(
                    'Legacy Broadcast',
                    `Your essence has been broadcast to the chain.\n\nHash: ${tx.hash.slice(0, 12)}...`,
                    [{ text: 'Acknowledged', onPress: () => navigation.navigate('Dashboard') }]
                );
            } else {
                showAlert('Error', 'Transmission failed.');
            }
        } catch (error: any) {
            showAlert('Error', error.message || 'Transaction failed');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
                <Caption style={styles.loadingText}>CALCULATING ETHEREAL FEES...</Caption>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header ... */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Verification</H2>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.textContainer}>
                    <H2 style={styles.title}>Review Transaction</H2>
                    <Body style={styles.subtitle}>Verify all details before broadcasting to the ledger.</Body>
                </View>

                <GlassCard style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Caption style={styles.label}>{isToken ? 'CONTRACT / RECIPIENT' : 'RECIPIENT'}</Caption>
                        <Body style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">{txData.to}</Body>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Caption style={styles.label}>AMOUNT</Caption>
                        <H3 style={styles.amountText}>{formatBalance(amountStr)} {symbol}</H3>
                    </View>

                    <View style={styles.detailRow}>
                        <Caption style={styles.label}>GAS FEE (EST.)</Caption>
                        <BodySmall style={styles.secondaryText}>{formatBalance(ethers.formatEther(gasFee))} ETH</BodySmall>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <H3>TOTAL COST</H3>
                        <View style={{ alignItems: 'flex-end' }}>
                            <H2 style={styles.totalValue}>{formatBalance(ethers.formatEther(ethCost))} ETH</H2>
                            {isToken && <BodySmall>+ {formatBalance(amountStr)} {symbol}</BodySmall>}
                        </View>
                    </View>
                </GlassCard>

                {hasInsufficientEth && (
                    <View style={[styles.securityWarning, { backgroundColor: 'rgba(255, 0, 0, 0.1)' }]}>
                        <Icon name="alert-triangle" size={16} color={THEME.colors.error} />
                        <Caption style={[styles.warningText, { color: THEME.colors.error }]}>
                            Insufficient ETH balance for transaction + gas.
                        </Caption>
                    </View>
                )}

                <View style={styles.securityWarning}>
                    <Icon name="shield" size={16} color={THEME.colors.secondary} />
                    <Caption style={styles.warningText}>
                        Transactions are immutable. Verify the recipient address carefully.
                    </Caption>
                </View>

                {txData.data && txData.data !== '0x' && (
                    <View style={[styles.securityWarning, { borderColor: 'rgba(255, 149, 0, 0.3)', borderWidth: 1 }]}>
                        <Icon name="alert-circle" size={16} color="#FF9500" />
                        <Caption style={[styles.warningText, { color: '#FF9500' }]}>
                            This transaction contains contract data. Ensure you trust the destination.
                        </Caption>
                    </View>
                )}

                <View style={styles.footer}>
                    {hasInsufficientEth ? (
                        <GothicButton
                            title="Insufficient Funds"
                            disabled
                            style={{ opacity: 0.5 }}
                            onPress={() => { }}
                        />
                    ) : (
                        <SwipeToConfirm
                            onConfirm={handleConfirm}
                            title={isSending ? 'BROADCASTING...' : 'Swipe to Broadcast'}
                        />
                    )}
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => navigation.goBack()}
                        disabled={isSending}
                    >
                        <BodySmall style={styles.cancelText}>Abondon Transaction</BodySmall>
                    </TouchableOpacity>
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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: THEME.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: THEME.spacing.md,
    },
    content: {
        padding: THEME.spacing.lg,
        flexGrow: 1,
    },
    textContainer: {
        marginTop: THEME.spacing.md,
        marginBottom: THEME.spacing.xl,
    },
    title: {
        textAlign: 'center',
        marginBottom: THEME.spacing.sm,
    },
    subtitle: {
        color: THEME.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    detailsCard: {
        padding: THEME.spacing.lg,
        marginBottom: THEME.spacing.xl,
        borderColor: 'rgba(230, 194, 0, 0.2)',
        borderWidth: 1,
    },
    detailRow: {
        marginBottom: THEME.spacing.md,
    },
    label: {
        marginBottom: 4,
        letterSpacing: 1,
    },
    addressText: {
        fontFamily: THEME.typography.fonts.heading,
        fontSize: 14,
        color: THEME.colors.text,
    },
    amountText: {
        color: THEME.colors.primary,
    },
    secondaryText: {
        color: THEME.colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: THEME.colors.border,
        marginVertical: THEME.spacing.md,
        opacity: 0.5,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: THEME.spacing.sm,
    },
    totalValue: {
        color: THEME.colors.primary,
    },
    securityWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(139, 0, 0, 0.05)',
        padding: THEME.spacing.md,
        borderRadius: THEME.radius.md,
        marginBottom: THEME.spacing.xl,
    },
    warningText: {
        marginLeft: THEME.spacing.sm,
        flex: 1,
        color: THEME.colors.textSecondary,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: THEME.spacing.xl,
    },
    loadingText: {
        marginTop: THEME.spacing.md,
        letterSpacing: 2,
        color: THEME.colors.primary,
    },
    cancelBtn: {
        marginTop: THEME.spacing.lg,
        alignItems: 'center',
    },
    cancelText: {
        color: THEME.colors.textSecondary,
        textDecorationLine: 'underline',
        opacity: 0.6,
    },
});
