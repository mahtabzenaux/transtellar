import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { THEME } from '../theme/theme';
import { H2, Body } from '../components/Typography';
import { Icon } from '../components/Icon';
import { SecurityService } from '../services/SecurityService';

interface Props {
    navigation: any;
    route: any; // Add route to accept callback
}

export const PinQueryScreen = ({ navigation, route }: Props) => {
    const { onSuccess, onCancel, stayOnSuccess } = route.params || {};
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleNumberPress = (num: string) => {
        if (pin.length < 6) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length >= 4) {
                setError(''); // Clear Error
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const verifyPin = async () => {
        const isValid = await SecurityService.verifyAuthCredential(pin);
        if (isValid) {
            if (onSuccess) onSuccess();
            if (!stayOnSuccess) navigation.goBack();
        } else {
            setError('Incorrect PIN');
            setPin('');
        }
    };

    useEffect(() => {
        if (pin.length === 6) { // Auto-submit on 6 digits? Or 4? Let's check SetupPin. It allows 4-6.
            verifyPin();
        }
    }, [pin]);


    const renderDot = (active: boolean, index: number) => (
        <View key={`dot-${index}`} style={[styles.dot, active && styles.dotActive, error ? { borderColor: THEME.colors.error } : {}]} />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    if (onCancel) onCancel();
                    navigation.goBack();
                }} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                </TouchableOpacity>
                <H2>Authenticate</H2>
            </View>

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <H2 style={styles.title}>Enter PIN</H2>
                    <Body style={styles.subtitle}>
                        Please enter your PIN to verify your identity.
                    </Body>
                    {error ? <Body style={{ color: THEME.colors.error, marginTop: 10, textAlign: 'center' }}>{error}</Body> : null}
                </View>

                <View style={styles.dotsContainer}>
                    {[...Array(6)].map((_, i) => renderDot(i < pin.length, i))}
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
        paddingBottom: THEME.spacing.xxl,
        justifyContent: 'space-between', // Push keypad to bottom
    },
    textContainer: {
        marginTop: THEME.spacing.xl,
        alignItems: 'center',
    },
    title: {
        color: THEME.colors.primary,
        textAlign: 'center',
        marginBottom: THEME.spacing.sm,
    },
    subtitle: {
        textAlign: 'center',
        color: THEME.colors.textSecondary,
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
        marginBottom: THEME.spacing.xl,
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
});
