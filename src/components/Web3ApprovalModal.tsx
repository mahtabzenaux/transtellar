import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, SafeAreaView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, Body, Caption } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import GlassCard from '../components/GlassCard';
import { WalletService } from '../services/WalletService';
import { ethers } from 'ethers';

const { width } = Dimensions.get('window');

export interface ApprovalRequest {
    method: string;
    params: any[];
    origin: string;
}

interface Props {
    visible: boolean;
    request: ApprovalRequest | null;
    onApprove: () => void;
    onReject: () => void;
}

export const Web3ApprovalModal = ({ visible, request, onApprove, onReject }: Props) => {
    const [gasEstimate, setGasEstimate] = useState<string>('Loading...');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            if (request?.method === 'eth_sendTransaction') {
                estimateGas();
            }
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible, request]);

    const estimateGas = async () => {
        if (!request) return;
        try {
            const tx = request.params[0];
            const estimate = await WalletService.estimateGas(tx.to, tx.value || '0', tx.data);
            setGasEstimate(ethers.formatUnits(estimate, 'gwei') + ' Gwei');
        } catch (error) {
            setGasEstimate('Unknown');
        }
    };

    if (!request) return null;

    const renderTransactionDetails = () => {
        const tx = request.params[0];
        const value = tx.value ? (tx.value.startsWith('0x') ? ethers.formatEther(BigInt(tx.value)) : tx.value) : '0';

        return (
            <View style={styles.detailsContainer}>
                <DetailRow label="To" value={tx.to} />
                <DetailRow label="Amount" value={`${value} ETH`} isPrimary />
                <DetailRow label="Estimated Gas" value={gasEstimate} />
                {tx.data && tx.data !== '0x' && (
                    <View style={styles.dataContainer}>
                        <Caption style={styles.dataLabel}>Hex Data</Caption>
                        <Body style={styles.dataText} numberOfLines={3}>{tx.data}</Body>
                    </View>
                )}
            </View>
        );
    };

    const renderMessageDetails = () => {
        const message = request.params[0];
        return (
            <GlassCard style={styles.messageCard}>
                <Body style={styles.messageText}>{message}</Body>
            </GlassCard>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="none">
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }] as any}>
                <SafeAreaView style={styles.safeArea}>
                    <GlassCard style={styles.content}>
                        <View style={styles.header}>
                            <View style={styles.iconPlaceholder}>
                                <Body style={styles.lockIcon}>🔒</Body>
                            </View>
                            <H2 style={styles.originText}>{request.origin}</H2>
                            <Caption style={styles.methodText}>
                                {request.method === 'eth_sendTransaction' ? 'Confirm Transaction' :
                                    request.method === 'personal_sign' ? 'Sign Message' : 'Connection Request'}
                            </Caption>
                        </View>

                        <View style={styles.body}>
                            {request.method === 'eth_sendTransaction' ? renderTransactionDetails() :
                                request.method === 'personal_sign' ? renderMessageDetails() :
                                    <Body style={styles.connectMsg}>Wants to view your wallet address and account activity.</Body>}
                        </View>

                        <View style={styles.footer}>
                            <GothicButton
                                title="Reject"
                                variant="outline"
                                onPress={onReject}
                                style={styles.footerBtn}
                            />
                            <GothicButton
                                title="Confirm"
                                onPress={onApprove}
                                style={styles.footerBtn}
                            />
                        </View>
                    </GlassCard>
                </SafeAreaView>
            </Animated.View>
        </Modal>
    );
};

const DetailRow = ({ label, value, isPrimary }: { label: string, value: string, isPrimary?: boolean }) => (
    <View style={styles.detailRow}>
        <Caption style={styles.detailLabel}>{label}</Caption>
        <Body style={[styles.detailValue, isPrimary && styles.primaryValue] as any} numberOfLines={1} ellipsizeMode="middle">
            {value}
        </Body>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: THEME.spacing.xl,
    },
    safeArea: {
        width: '100%',
    },
    content: {
        padding: THEME.spacing.xl,
        borderWidth: 1,
        borderColor: THEME.colors.primary,
    },
    header: {
        alignItems: 'center',
        marginBottom: THEME.spacing.xl,
    },
    iconPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,184,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: THEME.spacing.md,
        borderWidth: 1,
        borderColor: THEME.colors.primary,
    },
    lockIcon: {
        fontSize: 24,
    },
    originText: {
        fontSize: 20,
        textAlign: 'center',
    },
    methodText: {
        color: THEME.colors.primary,
        letterSpacing: 1.5,
        marginTop: THEME.spacing.xs,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    body: {
        marginBottom: THEME.spacing.xl,
    },
    detailsContainer: {
        width: '100%',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: THEME.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    detailLabel: {
        color: THEME.colors.textSecondary,
    },
    detailValue: {
        flex: 1,
        textAlign: 'right',
        marginLeft: THEME.spacing.lg,
    },
    primaryValue: {
        color: THEME.colors.primary,
        fontWeight: 'bold',
        fontSize: 18,
    },
    dataContainer: {
        marginTop: THEME.spacing.md,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: THEME.spacing.md,
        borderRadius: 8,
    },
    dataLabel: {
        marginBottom: THEME.spacing.xs,
    },
    dataText: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: THEME.colors.textSecondary,
    },
    messageCard: {
        padding: THEME.spacing.md,
        maxHeight: 200,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    connectMsg: {
        textAlign: 'center',
        color: THEME.colors.textSecondary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerBtn: {
        flex: 0.48,
    },
});
