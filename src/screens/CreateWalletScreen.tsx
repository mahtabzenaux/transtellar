import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, Body, BodySmall, Caption } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import { Icon } from '../components/Icon';
import { WalletService } from '../services/WalletService';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../navigation/types';
import { useAlert } from '../context/AlertContext';

type CreateWalletScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'CreateWallet'>;

interface Props {
    navigation: CreateWalletScreenNavigationProp;
}

export const CreateWalletScreen = ({ navigation }: Props) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { showAlert } = useAlert();

    const handleCreateWallet = async () => {
        setIsGenerating(true);
        try {
            const walletId = Date.now().toString();
            const result = await WalletService.createWallet(walletId);
            if (result && result.mnemonic) {
                navigation.navigate('MnemonicDisplay', {
                    mnemonic: result.mnemonic,
                    address: result.address,
                    walletId
                });
            } else {
                showAlert('Error', 'Failed to generate wallet.');
            }
        } catch (error) {
            console.error(error);
            showAlert('Error', 'An unexpected error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>New Legacy</H2>
            </View>

            <View style={styles.content}>
                <View style={styles.artworkContainer}>
                    <Icon name="shield" size={80} color={THEME.colors.primary} strokeWidth={1} />
                </View>

                <View style={styles.textContainer}>
                    <H2 style={styles.title}>Forge Your Future</H2>
                    <Body style={styles.description}>
                        We are about to generate a unique 12-word recovery phrase. This is the master key to your digital sovereignty.
                    </Body>

                    <View style={styles.warningBox}>
                        <View style={styles.warningHeader}>
                            <Icon name="shield" size={18} color={THEME.colors.secondary} />
                            <BodySmall style={styles.warningTitle}>CRITICAL SECURITY</BodySmall>
                        </View>
                        <Caption style={styles.warningText}>
                            If you lose this phrase, you lose your wallet forever. Transtellar does not store it, cannot recover it, and cannot reset it.
                        </Caption>
                    </View>
                </View>

                <View style={styles.footer}>
                    {isGenerating ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={THEME.colors.primary} />
                            <Caption style={styles.loadingText}>FORGING CRYPTOGRAPHIC KEYS...</Caption>
                        </View>
                    ) : (
                        <GothicButton
                            title="Generate Secret Phrase"
                            onPress={handleCreateWallet}
                            icon="plus"
                        />
                    )}
                </View>
            </View>
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
        flex: 1,
        padding: THEME.spacing.lg,
    },
    artworkContainer: {
        alignItems: 'center',
        marginVertical: THEME.spacing.xl,
        opacity: 0.8,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        marginBottom: THEME.spacing.md,
        textAlign: 'center',
    },
    description: {
        textAlign: 'center',
        color: THEME.colors.textSecondary,
        lineHeight: 24,
        marginBottom: THEME.spacing.xl,
    },
    warningBox: {
        padding: THEME.spacing.lg,
        borderRadius: THEME.radius.md,
        backgroundColor: 'rgba(139, 0, 0, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(139, 0, 0, 0.2)',
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: THEME.spacing.sm,
    },
    warningTitle: {
        color: THEME.colors.secondary,
        fontWeight: '700',
        marginLeft: THEME.spacing.xs,
        letterSpacing: 1,
    },
    warningText: {
        lineHeight: 20,
    },
    footer: {
        marginBottom: THEME.spacing.xl,
    },
    loadingContainer: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: THEME.spacing.md,
        color: THEME.colors.primary,
        letterSpacing: 2,
    },
});
