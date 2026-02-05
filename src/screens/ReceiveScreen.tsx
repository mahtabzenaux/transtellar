import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, Body, BodySmall, Caption } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import { GothicInput } from '../components/GothicInput';
import GlassCard from '../components/GlassCard';
import { Icon } from '../components/Icon';
import { useAuth } from '../store/AuthContext';
import { useAlert } from '../context/AlertContext';
import { WalletService } from '../services/WalletService';
import QRCode from 'react-native-qrcode-svg';
import Clipboard from '@react-native-clipboard/clipboard';
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { ethers } from 'ethers';

import { captureRef } from 'react-native-view-shot';
import Share from 'react-native-share';
import { AddressCard } from '../components/AddressCard';

export const ReceiveScreen = ({ navigation }: any) => {
    const { activeWallet } = useAuth();
    const { showAlert } = useAlert();
    const [amount, setAmount] = useState('');
    const chainId = WalletService.getChainId();
    const cardRef = React.useRef(null);
    const [isSharing, setIsSharing] = useState(false);

    if (!activeWallet) return null;

    const generateEvmUri = () => {
        // ... same logic
        let uri = `ethereum:${activeWallet.address}`;
        if (chainId !== 1) uri += `@${chainId}`;
        if (amount && !isNaN(parseFloat(amount))) {
            const wei = ethers.parseEther(amount).toString();
            uri += `?value=${wei}`;
        }
        return uri;
    };

    const handleCopy = () => {
        Clipboard.setString(activeWallet.address);
        ReactNativeHapticFeedback.trigger("impactLight");
        showAlert('Copied', 'Address copied to clipboard');
    };

    const handleShare = async () => {
        try {
            setIsSharing(true);
            const uri = await captureRef(cardRef, {
                format: "png",
                quality: 0.8,
                result: "tmpfile"
            });

            const shareOptions = {
                title: 'Share Wallet Address',
                message: `My TranStellar Wallet Address:\n${activeWallet.address}`,
                url: uri, // tmpfile URI works better on Android than base64
                type: 'image/png',
                failOnCancel: false,
            };

            await Share.open(shareOptions);
        } catch (error) {
            console.error('Share failed:', error);
            // Native Share cancellation throws error sometimes, ignore if just cancelled
            // showAlert('Error', 'Failed to share card.'); 
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Receive Assets</H2>
            </View>

            {/* Hidden Capture View - Rendered off-screen or inside a 0-height wrapper but visible for capture? 
                ViewShot requires the view to be "rendered" (collapsable=false). 
                Ideally, we show it to the user in a modal OR put it absolute positioned with opacity 0?
                Actually opacity 0 might result in empty capture on some implementations.
                Safe bet: Put it in a View that is absolute positioned behind everything.
            */}
            <View style={{ position: 'absolute', top: -1000, left: 0, opacity: 1, zIndex: -1 }}>
                <AddressCard
                    ref={cardRef}
                    address={activeWallet.address}
                    networkName={chainId === 11155111 ? 'Sepolia Testnet' : 'Ethereum Mainnet'}
                    networkSymbol="ETH"
                    walletName={activeWallet.name || "Main Wallet"}
                />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ... Normal Screen Content ... */}
                <View style={styles.networkInfo}>
                    <Caption style={styles.networkLabel}>ACTIVE NETWORK</Caption>
                    <BodySmall style={styles.networkName}>
                        {WalletService.getChainId() === 11155111 ? 'Sepolia Testnet' : 'Ethereum Mainnet'}
                    </BodySmall>
                </View>

                <GlassCard style={styles.qrCard}>
                    <View style={styles.qrContainer}>
                        <QRCode
                            value={generateEvmUri()}
                            size={200}
                            color={THEME.colors.background}
                            backgroundColor="#FFF"
                        />
                    </View>
                    <TouchableOpacity activeOpacity={0.7} onPress={handleCopy} style={styles.addressBox}>
                        <BodySmall style={styles.addressText}>{activeWallet.address}</BodySmall>
                        <View style={styles.copyRow}>
                            <Icon name="copy" size={14} color={THEME.colors.primary} />
                            <Caption style={styles.copyText}>Tap to copy address</Caption>
                        </View>
                    </TouchableOpacity>
                </GlassCard>

                <GothicInput
                    label="Request Amount (Optional)"
                    placeholder="0.00 ETH"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                />

                <View style={styles.warningContainer}>
                    <View style={styles.warningHeader}>
                        <Icon name="shield" size={16} color={THEME.colors.secondary} />
                        <BodySmall style={styles.warningTitle}>Security Warning</BodySmall>
                    </View>
                    <Caption style={styles.warningText}>
                        Only send assets on the correct network. Sending to the wrong network may result in permanent loss.
                    </Caption>
                </View>

                <View style={styles.footer}>
                    <GothicButton
                        title={isSharing ? "Generating..." : "Share ID Card"}
                        icon="qrc"
                        onPress={handleShare}
                        variant="primary"
                        disabled={isSharing}
                    />
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
        padding: THEME.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: THEME.spacing.md,
    },
    content: {
        flexGrow: 1,
        padding: THEME.spacing.lg,
    },
    networkInfo: {
        alignItems: 'center',
        marginBottom: THEME.spacing.lg,
    },
    networkLabel: {
        letterSpacing: 2,
    },
    networkName: {
        color: THEME.colors.primary,
        fontWeight: '700',
    },
    qrCard: {
        alignItems: 'center',
        padding: THEME.spacing.xl,
        marginBottom: THEME.spacing.xl,
    },
    qrContainer: {
        padding: THEME.spacing.md,
        backgroundColor: '#FFF',
        borderRadius: THEME.radius.lg,
        marginBottom: THEME.spacing.lg,
    },
    addressBox: {
        width: '100%',
        alignItems: 'center',
        padding: THEME.spacing.md,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: THEME.radius.md,
    },
    addressText: {
        fontFamily: 'monospace',
        textAlign: 'center',
        marginBottom: THEME.spacing.sm,
    },
    copyRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    copyText: {
        color: THEME.colors.primary,
        marginLeft: THEME.spacing.xs,
        fontWeight: '600',
    },
    warningContainer: {
        backgroundColor: 'rgba(139, 0, 0, 0.05)',
        padding: THEME.spacing.md,
        borderRadius: THEME.radius.md,
        borderWidth: 1,
        borderColor: 'rgba(139, 0, 0, 0.2)',
        marginTop: THEME.spacing.md,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: THEME.spacing.xs,
    },
    warningTitle: {
        color: THEME.colors.secondary,
        fontWeight: '700',
        marginLeft: THEME.spacing.xs,
    },
    warningText: {
        lineHeight: 18,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: THEME.spacing.xl,
    },
});
