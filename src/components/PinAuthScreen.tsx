import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useAlert } from '../context/AlertContext';
import { THEME } from '../theme/theme';
import { H2, Body } from '../components/Typography';
import { GothicButton } from '../components/GothicButton';
import { SecurityService } from '../services/SecurityService';

interface Props {
    visible: boolean;
    onSuccess: () => void;
    onCancel: () => void;
    title?: string;
}

export const PinAuthScreen = ({ visible, onSuccess, onCancel, title = 'Authorize Action' }: Props) => {
    const { showAlert } = useAlert();
    const [pin, setPin] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleNumberPress = (num: string) => {
        if (pin.length < 6) {
            setPin(pin + num);
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
    };

    const handleVerify = async () => {
        setIsVerifying(true);
        const isValid = await SecurityService.verifyAuthCredential(pin);
        setIsVerifying(false);

        if (isValid) {
            setPin('');
            onSuccess();
        } else {
            showAlert('Denied', 'Invalid PIN. Please try again.');
            setPin('');
        }
    };

    const renderDot = (active: boolean) => (
        <View style={[styles.dot, active && styles.dotActive]} />
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.container}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <H2 style={styles.title}>{title}</H2>
                        <Body style={styles.subtitle}>Enter your PIN to continue</Body>
                    </View>

                    <View style={styles.dotsContainer}>
                        {[...Array(6)].map((_, i) => renderDot(i < pin.length))}
                    </View>

                    <View style={styles.keypad}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={styles.key}
                                onPress={() => handleNumberPress(num.toString())}
                            >
                                <H2>{num}</H2>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.key} />
                        <TouchableOpacity
                            style={styles.key}
                            onPress={() => handleNumberPress('0')}
                        >
                            <H2>0</H2>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.key}
                            onPress={handleDelete}
                        >
                            <Body>DEL</Body>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <GothicButton
                            title={isVerifying ? 'Verifying...' : 'Authorize'}
                            onPress={handleVerify}
                            disabled={pin.length < 4 || isVerifying}
                            style={styles.button}
                        />
                        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                            <Body style={styles.cancelText}>Cancel</Body>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: THEME.colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: THEME.spacing.xl,
        borderTopWidth: 1,
        borderColor: THEME.colors.primary,
        height: '85%',
    },
    header: {
        marginVertical: THEME.spacing.xl,
    },
    title: {
        color: THEME.colors.primary,
        textAlign: 'center',
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
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
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
        aspectRatio: 1.2,
        justifyContent: 'center',
        alignItems: 'center',
        margin: '2%',
        borderRadius: 15,
        backgroundColor: 'rgba(230, 194, 0, 0.05)',
    },
    footer: {
        marginTop: 'auto',
    },
    button: {
        width: '100%',
    },
    cancelButton: {
        marginTop: THEME.spacing.md,
        alignItems: 'center',
    },
    cancelText: {
        color: THEME.colors.textSecondary,
    },
});
