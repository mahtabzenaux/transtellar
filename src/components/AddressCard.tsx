import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { THEME } from '../theme/theme';
import { H2, Body, Caption } from './Typography';
import { Icon } from './Icon';

interface Props {
    address: string;
    networkName: string;
    networkSymbol: string;
    walletName: string;
    style?: ViewStyle;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

export const AddressCard = React.forwardRef<View, Props>(({ address, networkName, networkSymbol, walletName, style }, ref) => {
    return (
        <View ref={ref} style={[styles.container, style]}>
            {/* Background Effects */}
            <View style={styles.glassBackground} />
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            {/* Header / Hole Details */}
            <View style={styles.header}>
                <View style={styles.holeContainer}>
                    <View style={styles.hole} />
                </View>
                <View style={[styles.band, { backgroundColor: THEME.colors.primary }]}>
                    <Caption style={styles.bandText}>TRANSTELLAR IDENTITY</Caption>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Icon name="shield" size={32} color={THEME.colors.primary} />
                </View>

                <H2 style={styles.walletName}>{walletName.toUpperCase()}</H2>
                <Body style={styles.networkTag}>{networkName} Network</Body>

                <View style={styles.qrContainer}>
                    <View style={styles.qrFrame}>
                        <QRCode
                            value={address}
                            size={160}
                            backgroundColor="white"
                            color="black"
                        />
                    </View>
                    <Icon name="qrc" size={24} color={THEME.colors.primary} style={styles.scanIcon} />
                </View>

                <View style={styles.addressContainer}>
                    <Caption color={THEME.colors.textSecondary} style={{ marginBottom: 4 }}>WALLET ADDRESS</Caption>
                    <Body style={styles.address}>{address}</Body>
                </View>

                {/* Footer Decor */}
                <View style={styles.footer}>
                    {/* Barcode-ish lines */}
                    <View style={styles.barcode}>
                        {[...Array(20)].map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.barLine,
                                    {
                                        width: Math.random() > 0.5 ? 2 : 1,
                                        opacity: Math.random() * 0.5 + 0.2
                                    }
                                ]}
                            />
                        ))}
                    </View>
                    <Caption style={styles.footerText}>SECURED VAULT ACCESS</Caption>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        backgroundColor: '#0A0A0A', // Dark base
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 0,
        alignSelf: 'center',
    },
    glassBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(20, 20, 20, 0.8)',
    },
    glowTop: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: THEME.colors.primary,
        opacity: 0.15,
        transform: [{ scale: 2 }],
    },
    glowBottom: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: THEME.colors.secondary,
        opacity: 0.1,
        transform: [{ scale: 2 }],
    },
    header: {
        alignItems: 'center',
        paddingTop: 16,
    },
    holeContainer: {
        width: 60,
        height: 12,
        backgroundColor: '#000',
        borderRadius: 6,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hole: {
        width: 40,
        height: 4,
        backgroundColor: '#1a1a1a',
        borderRadius: 2,
    },
    band: {
        width: '100%',
        paddingVertical: 4,
        alignItems: 'center',
        marginTop: 8,
    },
    bandText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 3,
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    logoContainer: {
        marginBottom: 16,
    },
    walletName: {
        fontSize: 24,
        letterSpacing: 2,
        marginBottom: 4,
        textAlign: 'center',
    },
    networkTag: {
        color: THEME.colors.textSecondary,
        fontSize: 14,
        letterSpacing: 1,
        marginBottom: 24,
        textTransform: 'uppercase',
    },
    qrContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 24,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrFrame: {
        backgroundColor: '#000', // Inverted QR for style? Or standard black on white?
        // Let's stick to standard black on white for reliability, but qr-svg handles transparent.
        // Wait, I set qr color="white" and bg="transparent", but container is white.
        // So it will be white dots on white bg = invisible.
        // Let's do Black dots on White bg.
    },
    scanIcon: {
        position: 'absolute',
        bottom: -12,
        backgroundColor: '#0A0A0A',
        borderRadius: 12,
        padding: 4,
        borderWidth: 2,
        borderColor: THEME.colors.primary,
        overflow: 'hidden',
    },
    addressContainer: {
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
    },
    address: {
        fontFamily: 'monospace',
        textAlign: 'center',
        fontSize: 12,
        color: THEME.colors.text,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    footer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        paddingTop: 16,
    },
    barcode: {
        flexDirection: 'row',
        height: 20,
        alignItems: 'center',
        gap: 2,
    },
    barLine: {
        backgroundColor: THEME.colors.textSecondary,
        height: '100%',
    },
    footerText: {
        fontSize: 10,
        letterSpacing: 2,
        color: THEME.colors.textSecondary,
    }
});
