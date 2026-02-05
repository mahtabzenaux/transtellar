import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, Body, BodySmall } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import { GothicInput } from '../components/GothicInput';
import { Icon } from '../components/Icon';
import { WalletService } from '../services/WalletService';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../navigation/types';
import { useAuth } from '../store/AuthContext';
import { useAlert } from '../context/AlertContext';

interface Props {
    navigation: any;
}

export const ImportWalletScreen = ({ navigation }: Props) => {
    const [mnemonic, setMnemonic] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const { completeOnboarding } = useAuth();
    const { showAlert } = useAlert();

    const handleImport = async () => {
        if (!mnemonic.trim()) {
            showAlert('Error', 'Please enter your recovery phrase.');
            return;
        }

        setIsImporting(true);
        try {
            console.log('[ImportWallet] Starting import process...');
            const walletId = Date.now().toString();

            const address = await WalletService.importFromMnemonic(mnemonic.trim(), walletId);
            if (address) {
                console.log('[ImportWallet] Mnemonic valid, storing in local registry...');
                await completeOnboarding({
                    id: walletId,
                    name: `Main Wallet`,
                    address,
                    createdAt: Date.now(),
                    index: 0
                });
                console.log('[ImportWallet] Onboarding complete.');
                navigation.navigate('Dashboard');
            } else {
                console.warn('[ImportWallet] WalletService.importFromMnemonic returned null');
                showAlert('Import Failed', 'The recovery phrase could not be processed. Please verify the words and try again.');
            }
        } catch (error: any) {
            console.error('[ImportWallet] Crash detected:', error);
            showAlert(
                'System Error',
                `Failed to import wallet: ${error.message || 'Unknown storage error'}\n\nPlease check if your device has enough space and biometric security enabled.`
            );
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Import Legacy</H2>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.artworkContainer}>
                    <Icon name="wallet" size={60} color={THEME.colors.primary} strokeWidth={1} />
                </View>

                <View style={styles.textContainer}>
                    <H2 style={styles.title}>Reclaim Your Power</H2>
                    <Body style={styles.subtitle}>
                        Enter your 12-word recovery phrase to restore access to your assets.
                    </Body>
                </View>

                <View style={styles.inputSection}>
                    <GothicInput
                        label="RECOVERY PHRASE"
                        placeholder="word1 word2 ... word12"
                        multiline
                        value={mnemonic}
                        onChangeText={setMnemonic}
                        autoCapitalize="none"
                    />
                    <BodySmall style={styles.helperText}>Separate words with single spaces.</BodySmall>
                </View>

                <View style={styles.footer}>
                    <GothicButton
                        title={isImporting ? 'Importing...' : 'Restore Wallet'}
                        onPress={handleImport}
                        disabled={isImporting}
                        icon="check"
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
    scrollContent: {
        padding: THEME.spacing.lg,
        paddingTop: THEME.spacing.xl,
    },
    artworkContainer: {
        alignItems: 'center',
        marginBottom: THEME.spacing.lg,
        opacity: 0.8,
    },
    textContainer: {
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
    inputSection: {
        marginBottom: THEME.spacing.xl,
    },
    helperText: {
        marginTop: THEME.spacing.xs,
        color: THEME.colors.textSecondary,
        opacity: 0.7,
        fontStyle: 'italic',
    },
    footer: {
        marginTop: THEME.spacing.xl,
        marginBottom: THEME.spacing.huge,
    },
});
