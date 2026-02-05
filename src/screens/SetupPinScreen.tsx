import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, Body, BodySmall, Caption } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import GlassCard from '../components/GlassCard';
import { Icon } from '../components/Icon';
import { SecurityService } from '../services/SecurityService';

import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList, MainStackParamList } from '../navigation/types';
import { useAuth } from '../store/AuthContext';
import { useAlert } from '../context/AlertContext';

interface Props {
    route: any;
    navigation: any;
}

export const SetupPinScreen = ({ route, navigation }: Props) => {
    const { wallet, isUpdate } = route.params || {};
    const { completeOnboarding } = useAuth();
    const { showAlert } = useAlert();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'create' | 'confirm'>('create');

    const handleNumberPress = (num: string) => {
        if (step === 'create' && pin.length < 6) {
            setPin(pin + num);
        } else if (step === 'confirm' && confirmPin.length < 6) {
            setConfirmPin(confirmPin + num);
        }
    };

    const handleDelete = () => {
        if (step === 'create') {
            setPin(pin.slice(0, -1));
        } else {
            setConfirmPin(confirmPin.slice(0, -1));
        }
    };

    const handleContinue = async () => {
        if (step === 'create') {
            if (pin.length < 4) {
                showAlert('Insecure PIN', 'PIN must be at least 4 digits.');
                return;
            }
            setStep('confirm');
        } else {
            if (pin === confirmPin) {
                const success = await SecurityService.setAuthCredential(pin);
                if (success) {
                    if (isUpdate) {
                        showAlert('Success', 'PIN updated successfully.',
                            [{ text: 'OK', onPress: () => navigation.goBack() }]
                        );
                    } else if (wallet) {
                        await completeOnboarding(wallet);
                        navigation.navigate('Dashboard');
                    } else {
                        showAlert('Success', 'PIN set successfully.',
                            [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
                        );
                    }
                } else {
                    showAlert('Error', 'Failed to save PIN.');
                }
            } else {
                showAlert('Mismatch', 'PINs do not match. Please try again.');
                setPin('');
                setConfirmPin('');
                setStep('create');
            }
        }
    };

    const renderDot = (active: boolean) => (
        <View style={[styles.dot, active && styles.dotActive]} />
    );

    const currentPin = step === 'create' ? pin : confirmPin;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Security</H2>
            </View>

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <H2 style={styles.title}>
                        {step === 'create' ? 'Secure Your Legacy' : 'Confirm Your Access'}
                    </H2>
                    <Body style={styles.subtitle}>
                        {step === 'create'
                            ? 'Create a numeric PIN to protect your wallet and authorize transactions.'
                            : 'Repeat the PIN to ensure it is correct.'}
                    </Body>
                </View>

                <View style={styles.dotsContainer}>
                    {[...Array(6)].map((_, i) => renderDot(i < currentPin.length))}
                </View>

                <View style={styles.keypad}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <TouchableOpacity
                            key={num}
                            style={styles.key}
                            activeOpacity={0.7}
                            onPress={() => handleNumberPress(num.toString())}
                        >
                            <H2 style={styles.keyText}>{num}</H2>
                        </TouchableOpacity>
                    ))}
                    <View style={styles.keyEmpty} />
                    <TouchableOpacity
                        style={styles.key}
                        activeOpacity={0.7}
                        onPress={() => handleNumberPress('0')}
                    >
                        <H2 style={styles.keyText}>0</H2>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.key}
                        activeOpacity={0.7}
                        onPress={handleDelete}
                    >
                        <Icon name="backspace" size={24} color={THEME.colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <GothicButton
                        title={step === 'create' ? 'Continue' : 'Finish Setup'}
                        onPress={handleContinue}
                        disabled={currentPin.length < 4}
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
        justifyContent: 'space-between',
    },
    textContainer: {
        marginTop: THEME.spacing.xl,
    },
    title: {
        color: THEME.colors.primary,
        textAlign: 'center',
        marginBottom: THEME.spacing.sm,
    },
    subtitle: {
        textAlign: 'center',
        color: THEME.colors.textSecondary,
        lineHeight: 22,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: THEME.spacing.xl,
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1.5,
        borderColor: THEME.colors.primary,
        marginHorizontal: THEME.spacing.sm,
    },
    dotActive: {
        backgroundColor: THEME.colors.primary,
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
    },
    key: {
        width: '28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: '2.5%',
        borderRadius: THEME.radius.full,
        backgroundColor: 'rgba(230, 194, 0, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(230, 194, 0, 0.1)',
    },
    keyEmpty: {
        width: '28%',
        aspectRatio: 1,
        margin: '2.5%',
    },
    keyText: {
        color: THEME.colors.primary,
        fontSize: 28,
    },
    footer: {
        marginBottom: THEME.spacing.xl,
    },
});
