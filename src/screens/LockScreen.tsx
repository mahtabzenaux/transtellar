import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { THEME } from '../theme/theme';
import { H1, Body, Caption } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import { Icon } from '../components/Icon';
import { useAuth } from '../store/AuthContext';
import { SecurityService } from '../services/SecurityService';

export const LockScreen = () => {
    const { unlock, activeWallet } = useAuth();
    const [showPin, setShowPin] = React.useState(false);
    const [pin, setPin] = React.useState('');
    const [error, setError] = React.useState('');
    const [isAuthenticating, setIsAuthenticating] = React.useState(false);
    const [lockoutRemaining, setLockoutRemaining] = React.useState(0);

    const showAlert = (title: string, message: string) => {
        Alert.alert(title, message);
    };

    const updateLockoutStatus = async () => {
        const status = await SecurityService.checkLockout();
        setLockoutRemaining(status.remaining);
    };

    React.useEffect(() => {
        updateLockoutStatus();
        const interval = setInterval(updateLockoutStatus, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleUnlock = async () => {
        if (lockoutRemaining > 0) {
            showAlert('Account Locked', `Please wait ${lockoutRemaining} seconds before trying again.`);
            return;
        }

        setIsAuthenticating(true);
        try {
            // Attempt global lock authentication (forces biometric/PIN)
            const success = await SecurityService.authenticateGlobally();

            if (success) {
                unlock();
            } else {
                // If cancelled or failed, prompt for PIN fallback if they have it
                const status = await SecurityService.checkLockout();
                if (status.isLocked) {
                    setLockoutRemaining(status.remaining);
                }

                const hasPin = await SecurityService.hasAuthCredential();
                if (hasPin) {
                    setShowPin(true);
                } else {
                    showAlert('Security Required', 'Please set up a PIN or biometrics in your device settings.');
                }
            }
        } catch (error) {
            console.error('Unlock failed:', error);
            showAlert('Error', 'Authentication failed. Please try again.');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handlePinSubmit = async (enteredPin: string) => {
        if (lockoutRemaining > 0) return;

        const success = await SecurityService.verifyAuthCredential(enteredPin);
        if (success) {
            unlock();
        } else {
            setPin('');
            const status = await SecurityService.checkLockout();
            if (status.isLocked) {
                setLockoutRemaining(status.remaining);
                setShowPin(false);
            }
            setError('Invalid PIN');
        }
    };

    const handleNumberPress = (num: string) => {
        if (pin.length < 6) {
            const newPin = pin + num;
            setPin(newPin);
            setError('');
            if (newPin.length === 6 || (newPin.length >= 4 && false)) { // Auto-submit?
                // Wait for user or auto? Let's auto-submit on 6, or manual on 4.
                // Assuming 6 digit PINs for consistency with SetupPin
            }
        }
    };

    // Auto-verify effect
    React.useEffect(() => {
        if (pin.length === 6) {
            handlePinSubmit(pin);
        }
    }, [pin]);

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const renderDot = (active: boolean) => (
        <View style={[styles.dot, active && styles.dotActive]} />
    );

    if (showPin) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.content, { justifyContent: 'space-between' }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setShowPin(false)} style={styles.backBtn}>
                            <Icon name="arrow-left" size={24} color={THEME.colors.primary} />
                        </TouchableOpacity>
                        <H1 style={styles.titleSmall}>ENTER PIN</H1>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={styles.pinContainer}>
                        {error ? <Body style={{ color: THEME.colors.error, marginBottom: 20 }}>{error}</Body> : null}
                        <View style={styles.dotsContainer}>
                            {[...Array(6)].map((_, i) => renderDot(i < pin.length))}
                        </View>
                    </View>

                    <View style={styles.keypad}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={styles.key}
                                activeOpacity={0.7}
                                onPress={() => handleNumberPress(num.toString())}
                            >
                                <H1 style={styles.keyText}>{num}</H1>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.keyEmpty} />
                        <TouchableOpacity
                            style={styles.key}
                            activeOpacity={0.7}
                            onPress={() => handleNumberPress('0')}
                        >
                            <H1 style={styles.keyText}>0</H1>
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
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.lockContainer}>
                    <View style={styles.lockGlow} />
                    <View style={styles.lockInner}>
                        <Icon name="lock" size={48} color={THEME.colors.primary} strokeWidth={1.5} />
                    </View>
                </View>

                <View style={styles.textContainer}>
                    <H1 style={styles.title}>TRANSTELLAR SECURED</H1>
                    {lockoutRemaining > 0 ? (
                        <View style={styles.lockoutBadge}>
                            <Caption style={styles.lockoutText}>LOCKED FOR {lockoutRemaining}S</Caption>
                        </View>
                    ) : (
                        <Body style={styles.subtitle}>Authentication required to access the vault.</Body>
                    )}
                </View>

                <GothicButton
                    title="Unlock"
                    onPress={handleUnlock}
                    style={styles.button}
                    icon="shield"
                />

                <TouchableOpacity style={styles.forgotBtn}>
                    <Caption style={styles.forgotText}>Lost your access key?</Caption>
                </TouchableOpacity>
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: THEME.spacing.huge,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: THEME.spacing.lg,
    },
    lockContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: THEME.spacing.huge,
    },
    lockGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: THEME.colors.primary,
        opacity: 0.1,
        transform: [{ scale: 1.5 }],
    },
    lockInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(230, 194, 0, 0.2)',
        backgroundColor: 'rgba(230, 194, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: THEME.spacing.huge,
    },
    title: {
        letterSpacing: 6,
        color: THEME.colors.primary,
        marginBottom: THEME.spacing.sm,
        textAlign: 'center',
    },
    titleSmall: {
        letterSpacing: 2,
        color: THEME.colors.primary,
    },
    subtitle: {
        color: THEME.colors.textSecondary,
        textAlign: 'center',
        opacity: 0.8,
    },
    button: {
        width: '100%',
    },
    forgotBtn: {
        marginTop: THEME.spacing.xl,
    },
    forgotText: {
        color: THEME.colors.textSecondary,
        textDecorationLine: 'underline',
        opacity: 0.6,
    },
    // PIN Styles
    pinContainer: {
        alignItems: 'center',
        marginVertical: THEME.spacing.xl,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
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
    backBtn: {
        padding: 8,
    },
    lockoutBadge: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        paddingHorizontal: THEME.spacing.md,
        paddingVertical: THEME.spacing.xs,
        borderRadius: THEME.radius.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.2)',
    },
    lockoutText: {
        color: THEME.colors.error,
        letterSpacing: 1,
    }
});
