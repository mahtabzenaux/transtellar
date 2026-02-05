import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { THEME } from '../theme/theme';
import { H1, Body, BodySmall } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import { Icon } from '../components/Icon';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../navigation/types';

type WelcomeScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

interface Props {
    navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen = ({ navigation }: Props) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Icon name="shield" size={60} color={THEME.colors.primary} strokeWidth={1.5} />
                    </View>
                    <H1 style={styles.title}>TRANSTELLAR</H1>
                    <Body style={styles.subtitle}>SECURE • ELEGANT • SOVEREIGN</Body>
                </View>

                <View style={styles.buttonContainer}>
                    <GothicButton
                        title="Create New Legacy"
                        onPress={() => navigation.navigate('CreateWallet')}
                        style={styles.button}
                        icon="plus"
                    />
                    <GothicButton
                        title="Import Existing"
                        variant="outline"
                        onPress={() => navigation.navigate('ImportWallet')}
                        style={styles.button}
                        icon="wallet"
                    />
                    <TouchableOpacity
                        style={styles.termsBtn}
                        onPress={() => {/* Open Terms */ }}
                    >
                        <BodySmall style={styles.termsText}>Terms of Service & Privacy Policy</BodySmall>
                    </TouchableOpacity>
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
    content: {
        flex: 1,
        padding: THEME.spacing.xl,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: THEME.spacing.huge,
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: THEME.radius.xl,
        backgroundColor: 'rgba(230, 194, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: THEME.spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(230, 194, 0, 0.2)',
    },
    title: {
        letterSpacing: 8,
        color: THEME.colors.primary,
        fontFamily: THEME.typography.fonts.heading,
        fontSize: 40,
        marginBottom: THEME.spacing.sm,
    },
    subtitle: {
        color: THEME.colors.textSecondary,
        letterSpacing: 3,
        fontSize: 12,
        fontWeight: '600',
    },
    buttonContainer: {
        width: '100%',
        marginBottom: THEME.spacing.xxl,
    },
    button: {
        marginVertical: THEME.spacing.sm,
    },
    termsBtn: {
        marginTop: THEME.spacing.lg,
        alignItems: 'center',
    },
    termsText: {
        color: THEME.colors.textSecondary,
        opacity: 0.6,
        textDecorationLine: 'underline',
    },
});
