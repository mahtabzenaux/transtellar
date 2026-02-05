import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useAlert } from '../context/AlertContext';
import { THEME } from '../theme/theme';
import { H2, Body, BodySmall, Caption } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import GlassCard from '../components/GlassCard';
import { Icon } from '../components/Icon';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../navigation/types';
import { useAuth } from '../store/AuthContext';

type MnemonicDisplayScreenRouteProp = RouteProp<OnboardingStackParamList, 'MnemonicDisplay'>;
type MnemonicDisplayScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'MnemonicDisplay'>;

interface Props {
    route: MnemonicDisplayScreenRouteProp;
    navigation: MnemonicDisplayScreenNavigationProp;
}

export const MnemonicDisplayScreen = ({ route, navigation }: Props) => {
    const { mnemonic } = route.params;
    const { showAlert } = useAlert();
    const words = mnemonic.split(' ');

    const handleConfirm = () => {
        showAlert(
            'Safety Confirmation',
            'Did you write down the phrase? You will not see it again after this step.',
            [
                { text: 'Wait', style: 'cancel' },
                {
                    text: 'Yes, Secured',
                    onPress: () => {
                        navigation.navigate('MnemonicVerify', {
                            mnemonic,
                            address: route.params.address,
                            walletId: route.params.walletId
                        });
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Secret Phrase</H2>
            </View>

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <H2 style={styles.title}>Your Legacy Mnemonic</H2>
                    <Body style={styles.subtitle}>
                        Write these 12 words down on physical paper. Keep them offline and hidden.
                    </Body>
                </View>

                <GlassCard style={styles.mnemonicContainer}>
                    <FlatList
                        data={words}
                        numColumns={2}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <View style={styles.wordItem}>
                                <Caption style={styles.wordIndex}>{index + 1}</Caption>
                                <Body style={styles.wordText}>{item}</Body>
                            </View>
                        )}
                        scrollEnabled={false}
                    />
                </GlassCard>

                <View style={styles.securitySection}>
                    <View style={styles.securityBox}>
                        <View style={styles.securityHeader}>
                            <Icon name="shield" size={16} color={THEME.colors.secondary} />
                            <BodySmall style={styles.securityTitle}>OFFLINE STORAGE ONLY</BodySmall>
                        </View>
                        <Caption style={styles.securityText}>
                            • Never take a screenshot or photo.{'\n'}
                            • Never store in cloud or email.{'\n'}
                            • Never share with anyone.
                        </Caption>
                    </View>
                </View>

                <View style={styles.footer}>
                    <GothicButton
                        title="I Have Secured My Legacy"
                        onPress={handleConfirm}
                        icon="check"
                    />
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
        paddingHorizontal: THEME.spacing.lg,
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
    mnemonicContainer: {
        padding: THEME.spacing.md,
        marginBottom: THEME.spacing.xl,
        borderColor: 'rgba(230, 194, 0, 0.3)',
        borderWidth: 1,
    },
    wordItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: THEME.spacing.md,
        margin: THEME.spacing.xs,
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.md,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    wordIndex: {
        color: THEME.colors.primary,
        marginRight: THEME.spacing.md,
        width: 14,
        fontWeight: '700',
    },
    wordText: {
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    securitySection: {
        marginBottom: THEME.spacing.xl,
    },
    securityBox: {
        backgroundColor: 'rgba(139, 0, 0, 0.05)',
        padding: THEME.spacing.lg,
        borderRadius: THEME.radius.md,
        borderWidth: 1,
        borderColor: 'rgba(139, 0, 0, 0.2)',
    },
    securityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: THEME.spacing.sm,
    },
    securityTitle: {
        color: THEME.colors.secondary,
        fontWeight: '700',
        marginLeft: THEME.spacing.xs,
        letterSpacing: 1,
    },
    securityText: {
        lineHeight: 20,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: THEME.spacing.xl,
    },
});
