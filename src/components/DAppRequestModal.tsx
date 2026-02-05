import React from 'react';
import { View, StyleSheet, Modal, SafeAreaView, TouchableOpacity } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, Body, Caption } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import GlassCard from '../components/GlassCard';

export interface DAppRequestInfo {
    method: string;
    params: any[];
    origin: string;
}

interface DAppRequestModalProps {
    visible: boolean;
    request: DAppRequestInfo | null;
    onApprove: () => void;
    onReject: () => void;
}

export const DAppRequestModal = ({ visible, request, onApprove, onReject }: DAppRequestModalProps) => {
    if (!request) return null;

    const renderDetails = () => {
        switch (request.method) {
            case 'eth_requestAccounts':
                return (
                    <Body style={styles.details}>
                        This site is requesting access to your wallet address. They will NOT have access to your private keys.
                    </Body>
                );
            case 'eth_sendTransaction':
                const tx = request.params[0];
                return (
                    <View style={styles.txDetails}>
                        <Body style={styles.details}>Review Transaction:</Body>
                        <GlassCard style={styles.txCard}>
                            <Caption>To: {tx.to}</Caption>
                            <Caption>Value: {tx.value || '0'} ETH</Caption>
                            <Caption>Data: {tx.data?.slice(0, 10)}...</Caption>
                        </GlassCard>
                    </View>
                );
            case 'personal_sign':
                return (
                    <View style={styles.txDetails}>
                        <Body style={styles.details}>Sign Message:</Body>
                        <GlassCard style={styles.txCard}>
                            <Body style={styles.messageText}>{request.params[0]}</Body>
                        </GlassCard>
                    </View>
                );
            default:
                return <Body style={styles.details}>Method: {request.method}</Body>;
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <H2 style={styles.title}>TRANSTELLAR SECURITY</H2>
                            <Caption style={styles.origin}>{request.origin}</Caption>
                        </View>

                        <View style={styles.body}>
                            {renderDetails()}
                        </View>

                        <View style={styles.footer}>
                            <GothicButton
                                title="Approve"
                                onPress={onApprove}
                                style={styles.button}
                            />
                            <GothicButton
                                title="Reject"
                                variant="outline"
                                onPress={onReject}
                                style={styles.button}
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    safeArea: {
        width: '100%',
    },
    content: {
        backgroundColor: THEME.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: THEME.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.primary,
    },
    header: {
        alignItems: 'center',
        marginBottom: THEME.spacing.lg,
    },
    title: {
        color: THEME.colors.primary,
        letterSpacing: 2,
    },
    origin: {
        color: THEME.colors.textSecondary,
        marginTop: THEME.spacing.xs,
    },
    body: {
        marginBottom: THEME.spacing.xl,
    },
    details: {
        textAlign: 'center',
        lineHeight: 22,
    },
    txDetails: {
        width: '100%',
    },
    txCard: {
        marginTop: THEME.spacing.md,
        padding: THEME.spacing.md,
    },
    messageText: {
        fontSize: 14,
        fontFamily: 'monospace',
    },
    footer: {
        width: '100%',
    },
    button: {
        marginVertical: THEME.spacing.xs,
    },
});
