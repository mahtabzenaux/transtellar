import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, Body, BodySmall, Caption } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import { useAlert } from '../context/AlertContext';
import GlassCard from '../components/GlassCard';
import { Icon } from '../components/Icon';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../navigation/types';
import { useAuth } from '../store/AuthContext';

type MnemonicVerifyScreenRouteProp = RouteProp<OnboardingStackParamList, 'MnemonicVerify'>;
type MnemonicVerifyScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'MnemonicVerify'>;

interface Props {
    route: MnemonicVerifyScreenRouteProp;
    navigation: MnemonicVerifyScreenNavigationProp;
}

export const MnemonicVerifyScreen = ({ navigation, route }: any) => {
    const { mnemonic, walletId } = route.params;
    const { completeOnboarding } = useAuth();
    const { showAlert } = useAlert();
    const correctWords = mnemonic.split(' ');

    const [shuffledWords, setShuffledWords] = useState<string[]>([]);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        const scrambled = [...correctWords].sort(() => Math.random() - 0.5);
        setShuffledWords(scrambled);
    }, []);

    const handleWordPress = (word: string, index: number) => {
        setSelectedWords([...selectedWords, word]);
        setShuffledWords(shuffledWords.filter((_, i) => i !== index));
    };

    const handleRemoveWord = (word: string, index: number) => {
        setShuffledWords([...shuffledWords, word]);
        setSelectedWords(selectedWords.filter((_, i) => i !== index));
    };

    const handleVerify = async () => {
        if (selectedWords.join(' ') === mnemonic) {
            setIsVerifying(true);
            try {
                navigation.navigate('SetupPin', {
                    wallet: {
                        id: walletId,
                        name: 'Main Wallet',
                        address: '', // Address is not passed in the new instruction, keeping it empty or removing it might be an option. For now, keeping it as empty string.
                        createdAt: Date.now(),
                        index: 0
                    }
                });
            } catch (error) {
                showAlert('Error', 'Verification failed to save.');
            } finally {
                setIsVerifying(false);
            }
        } else {
            showAlert('Security Check', 'The phrase does not match. Please try again.');
            setShuffledWords([...correctWords].sort(() => Math.random() - 0.5));
            setSelectedWords([]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                    </TouchableOpacity>
                    <H2 style={styles.title}>Prove Your Legacy</H2>
                    <Body style={styles.subtitle}>
                        Select the words in the correct order to verify your backup.
                    </Body>
                </View>

                {/* ... other content remains ... */}

                <GlassCard style={styles.selectedContainer}>
                    <View style={styles.wordCloud}>
                        {selectedWords.length === 0 && (
                            <Caption style={styles.placeholder}>Your sequence will appear here...</Caption>
                        )}
                        {selectedWords.map((word, index) => (
                            <TouchableOpacity
                                key={`selected-${index}`}
                                style={styles.wordBadgeActive}
                                onPress={() => handleRemoveWord(word, index)}
                            >
                                <BodySmall style={styles.wordTextActive}>{word}</BodySmall>
                            </TouchableOpacity>
                        ))}
                    </View>
                </GlassCard>

                <View style={styles.shuffledContainer}>
                    <View style={styles.wordCloud}>
                        {shuffledWords.map((word, index) => (
                            <TouchableOpacity
                                key={`shuffled-${index}`}
                                style={styles.wordBadge}
                                onPress={() => handleWordPress(word, index)}
                            >
                                <BodySmall style={styles.wordText}>{word}</BodySmall>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.footer}>
                    <GothicButton
                        title={isVerifying ? 'Verifying...' : 'Verify & Finish'}
                        onPress={handleVerify}
                        disabled={selectedWords.length !== 12 || isVerifying}
                        variant="primary"
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
    content: {
        flexGrow: 1,
        padding: THEME.spacing.lg,
    },
    header: {
        marginTop: THEME.spacing.md,
        marginBottom: THEME.spacing.xl,
    },
    backBtn: {
        marginBottom: THEME.spacing.md,
    },
    title: {
        color: THEME.colors.primary,
        textAlign: 'center',
        marginBottom: THEME.spacing.sm,
    },
    subtitle: {
        color: THEME.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    selectedContainer: {
        minHeight: 140,
        padding: THEME.spacing.md,
        marginBottom: THEME.spacing.lg,
        borderColor: THEME.colors.primary,
        borderWidth: 0.5,
    },
    shuffledContainer: {
        flex: 1,
    },
    wordCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    placeholder: {
        marginTop: THEME.spacing.xl,
        opacity: 0.5,
        letterSpacing: 1,
    },
    wordBadge: {
        backgroundColor: THEME.colors.surface,
        paddingHorizontal: THEME.spacing.md,
        paddingVertical: THEME.spacing.sm,
        borderRadius: THEME.radius.md,
        margin: 4,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    wordBadgeActive: {
        backgroundColor: THEME.colors.primary,
        paddingHorizontal: THEME.spacing.md,
        paddingVertical: THEME.spacing.sm,
        borderRadius: THEME.radius.md,
        margin: 4,
    },
    wordText: {
        color: THEME.colors.text,
        fontWeight: '500',
    },
    wordTextActive: {
        color: THEME.colors.background,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 'auto',
        marginBottom: THEME.spacing.lg,
    },
});
