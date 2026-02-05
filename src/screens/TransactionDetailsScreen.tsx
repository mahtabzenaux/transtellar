import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, H3, Body, BodySmall, Caption } from '../components/Typography';
import GlassCard from '../components/GlassCard';
import { Icon } from '../components/Icon';
import { WalletService, NETWORKS } from '../services/WalletService';
import { ethers } from 'ethers';

export const TransactionDetailsScreen = ({ route, navigation }: any) => {
    const { txHash } = route.params;
    const [txDetails, setTxDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, [txHash]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const provider = WalletService.getProvider();
            const tx = await provider.getTransaction(txHash);
            const receipt = await provider.getTransactionReceipt(txHash);

            setTxDetails({
                ...tx,
                receipt,
            });
        } catch (error) {
            console.error('Failed to fetch tx details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openInExplorer = () => {
        const chainId = WalletService.getChainId();
        const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
        if (network?.explorerUrl) {
            Linking.openURL(`${network.explorerUrl}/tx/${txHash}`);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
                <Caption style={styles.loadingText}>DECODING ARCHIVES...</Caption>
            </SafeAreaView>
        );
    }

    const DetailItem = ({ label, value, isLink = false }: any) => (
        <View style={styles.detailItem}>
            <Caption style={styles.label}>{label}</Caption>
            <Body
                style={[styles.value, isLink && { color: THEME.colors.primary }] as any}
                numberOfLines={1}
                ellipsizeMode="middle"
            >
                {value}
            </Body>
        </View>
    );

    const isConfirmed = txDetails?.receipt?.status === 1;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Record Details</H2>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <GlassCard style={styles.statusCard}>
                    <View style={[styles.statusIcon, { backgroundColor: isConfirmed ? 'rgba(0, 200, 83, 0.05)' : 'rgba(230, 194, 0, 0.05)' }]}>
                        <Icon
                            name={isConfirmed ? 'check' : 'refresh'}
                            size={32}
                            color={isConfirmed ? THEME.colors.success : THEME.colors.primary}
                        />
                    </View>
                    <H3 style={styles.statusTitle}>{isConfirmed ? 'Confirmed' : 'Processing'}</H3>
                    <BodySmall style={styles.hashText}>{txHash}</BodySmall>
                </GlassCard>

                <View style={styles.section}>
                    <Caption style={styles.sectionTitle}>TRANSACTION DATA</Caption>
                    <GlassCard style={styles.detailsCard}>
                        <DetailItem label="FROM" value={txDetails?.from} />
                        <View style={styles.divider} />
                        <DetailItem label="TO" value={txDetails?.to} />
                        <View style={styles.divider} />
                        <DetailItem label="VALUE" value={txDetails ? ethers.formatEther(txDetails.value || 0) + ' ETH' : '0.0 ETH'} />
                    </GlassCard>
                </View>

                <View style={styles.section}>
                    <Caption style={styles.sectionTitle}>PROTOCOL DATA</Caption>
                    <GlassCard style={styles.detailsCard}>
                        <DetailItem label="GAS USED" value={txDetails?.receipt?.gasUsed?.toString() || '0'} />
                        <View style={styles.divider} />
                        <DetailItem label="GAS PRICE" value={txDetails ? ethers.formatUnits(txDetails.gasPrice || 0, 'gwei') + ' Gwei' : '0'} />
                        <View style={styles.divider} />
                        <DetailItem label="NONCE" value={txDetails?.nonce?.toString() || '0'} />
                        <View style={styles.divider} />
                        <DetailItem label="BLOCK NUMBER" value={txDetails?.blockNumber?.toString() || 'Pending'} />
                    </GlassCard>
                </View>

                <TouchableOpacity onPress={openInExplorer} style={styles.explorerBtn} activeOpacity={0.7}>
                    <Icon name="arrow-up-right" size={16} color={THEME.colors.primary} />
                    <BodySmall style={styles.explorerText}>View on Block Explorer</BodySmall>
                </TouchableOpacity>
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
        paddingBottom: THEME.spacing.huge,
    },
    statusCard: {
        alignItems: 'center',
        padding: THEME.spacing.xl,
        marginBottom: THEME.spacing.xl,
        borderColor: 'rgba(230, 194, 0, 0.2)',
        borderWidth: 1,
    },
    statusIcon: {
        width: 64,
        height: 64,
        borderRadius: THEME.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: THEME.spacing.md,
    },
    statusTitle: {
        marginBottom: THEME.spacing.xs,
        letterSpacing: 1,
    },
    hashText: {
        color: THEME.colors.textSecondary,
        opacity: 0.6,
        fontSize: 10,
    },
    section: {
        marginBottom: THEME.spacing.xl,
    },
    sectionTitle: {
        marginLeft: THEME.spacing.xs,
        marginBottom: THEME.spacing.sm,
        letterSpacing: 2,
        opacity: 0.7,
    },
    detailsCard: {
        padding: THEME.spacing.lg,
    },
    detailItem: {
        marginVertical: THEME.spacing.xs,
    },
    label: {
        marginBottom: 2,
        letterSpacing: 1,
        fontSize: 10,
    },
    value: {
        fontFamily: THEME.typography.fonts.heading,
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: THEME.colors.border,
        marginVertical: THEME.spacing.md,
        opacity: 0.3,
    },
    explorerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: THEME.spacing.md,
        borderRadius: THEME.radius.md,
        backgroundColor: 'rgba(230, 194, 0, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(230, 194, 0, 0.1)',
        marginTop: THEME.spacing.md,
    },
    explorerText: {
        color: THEME.colors.primary,
        fontWeight: '700',
        marginLeft: THEME.spacing.sm,
        letterSpacing: 1,
    },
    loadingText: {
        marginTop: THEME.spacing.md,
        letterSpacing: 2,
        color: THEME.colors.primary,
    },
});
