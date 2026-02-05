import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAlert } from '../context/AlertContext';
import { THEME } from '../theme/theme';
import { H2, Body, BodySmall, Caption } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import { GothicInput } from '../components/GothicInput';
import { Icon } from '../components/Icon';
import GlassCard from '../components/GlassCard';
import { TokenService } from '../services/TokenService';
import { WalletService } from '../services/WalletService';
import { ethers } from 'ethers';

export const AddTokenScreen = ({ navigation }: any) => {
    const { showAlert } = useAlert();
    const [tokenAddress, setTokenAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokenMetadata, setTokenMetadata] = useState<any>(null);

    const handleSearch = async () => {
        if (!ethers.isAddress(tokenAddress)) {
            showAlert('Error', 'Invalid contract address.');
            return;
        }

        setLoading(true);
        try {
            const metadata = await TokenService.getCustomTokenMetadata(tokenAddress);
            if (metadata) {
                setTokenMetadata(metadata);
            } else {
                showAlert('Error', 'Could not find token at this address.');
            }
        } catch (error) {
            showAlert('Error', 'Failed to fetch token data.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!tokenMetadata) return;

        try {
            const chainId = WalletService.getChainId();
            const success = await TokenService.addCustomToken(tokenAddress, chainId);
            if (success) {
                showAlert('Success', `${tokenMetadata.symbol} has been added to your vault.`, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                showAlert('Error', 'Token already in your vault or failed to add.');
            }
        } catch (error) {
            showAlert('Error', 'Failed to add token.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Summoning</H2>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.textContainer}>
                    <H2 style={styles.title}>Add Custom Token</H2>
                    <Body style={styles.subtitle}>
                        Enter the contract address of the ERC-20 token you wish to track.
                    </Body>
                </View>

                <View style={styles.form}>
                    <GothicInput
                        label="CONTRACT ADDRESS"
                        placeholder="0x..."
                        value={tokenAddress}
                        onChangeText={(text) => {
                            setTokenAddress(text);
                            setTokenMetadata(null);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <GothicButton
                        title={loading ? 'SCANNING ABYSS...' : 'Identify Token'}
                        onPress={handleSearch}
                        disabled={loading || !tokenAddress}
                        variant="ghost"
                        style={styles.searchButton}
                        icon="refresh"
                    />

                    {loading && (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator color={THEME.colors.primary} />
                        </View>
                    )}

                    {tokenMetadata && (
                        <GlassCard style={styles.metadataCard}>
                            <View style={styles.metadataContent}>
                                <View style={styles.tokenLogo}>
                                    <Icon name="wallet" size={32} color={THEME.colors.primary} />
                                </View>
                                <View style={styles.tokenInfo}>
                                    <H2>{tokenMetadata.name}</H2>
                                    <BodySmall style={styles.symbolText}>{tokenMetadata.symbol}</BodySmall>
                                </View>
                            </View>

                            <View style={styles.separator} />

                            <View style={styles.metadataRow}>
                                <Caption>DECIMALS</Caption>
                                <Body style={styles.boldText}>{tokenMetadata.decimals}</Body>
                            </View>

                            <GothicButton
                                title="Add to Ledger"
                                onPress={handleAdd}
                                style={styles.addButton}
                                icon="plus"
                            />
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
        padding: THEME.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: THEME.spacing.md,
    },
    scrollContent: {
        padding: THEME.spacing.lg,
        paddingBottom: THEME.spacing.xxl,
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
    form: {
        flex: 1,
    },
    searchButton: {
        marginTop: THEME.spacing.md,
    },
    loaderContainer: {
        marginTop: THEME.spacing.xl,
        alignItems: 'center',
    },
    metadataCard: {
        marginTop: THEME.spacing.xl,
        padding: THEME.spacing.lg,
        borderColor: 'rgba(230, 194, 0, 0.2)',
        borderWidth: 1,
    },
    metadataContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: THEME.spacing.md,
    },
    tokenLogo: {
        width: 56,
        height: 56,
        borderRadius: THEME.radius.md,
        backgroundColor: 'rgba(230, 194, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.md,
    },
    tokenInfo: {
        flex: 1,
    },
    symbolText: {
        color: THEME.colors.primary,
        fontWeight: '700',
        letterSpacing: 2,
    },
    separator: {
        height: 1,
        backgroundColor: THEME.colors.border,
        marginVertical: THEME.spacing.md,
        opacity: 0.5,
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.lg,
    },
    boldText: {
        fontWeight: '700',
    },
    addButton: {
        marginTop: THEME.spacing.sm,
    },
});
