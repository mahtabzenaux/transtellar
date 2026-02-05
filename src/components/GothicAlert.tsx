import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { THEME } from '../theme/theme';
import { H3, Body } from './Typography';
import { Icon } from './Icon';
import GlassCard from './GlassCard';

const { width } = Dimensions.get('window');

interface AlertAction {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertProps {
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertAction[];
    onClose: () => void;
}

export const GothicAlert: React.FC<AlertProps> = ({ visible, title, message, buttons = [], onClose }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Ensure we always have at least one button
    const actions = buttons.length > 0 ? buttons : [{ text: 'OK', onPress: onClose, style: 'default' }];

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                <Animated.View style={[styles.alertContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <GlassCard style={styles.card}>
                        <View style={styles.header}>
                            <Icon name="shield" size={24} color={THEME.colors.primary} />
                            <H3 style={styles.title}>{title}</H3>
                        </View>

                        {message && (
                            <Body style={styles.message}>
                                {message}
                            </Body>
                        )}

                        <View style={styles.buttonContainer}>
                            {actions.map((btn, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        btn.style === 'cancel' && styles.cancelButton,
                                        btn.style === 'destructive' && styles.destructiveButton,
                                        index > 0 && styles.buttonMargin
                                    ]}
                                    onPress={() => {
                                        onClose();
                                        if (btn.onPress) btn.onPress();
                                    }}
                                >
                                    <Body style={[
                                        styles.buttonText,
                                        btn.style === 'cancel' && styles.cancelText,
                                        btn.style === 'destructive' && styles.destructiveText
                                    ]}>
                                        {btn.text}
                                    </Body>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </GlassCard>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    alertContainer: {
        width: width * 0.85,
        maxWidth: 350,
    },
    card: {
        padding: THEME.spacing.lg,
        borderColor: THEME.colors.primary,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: THEME.spacing.md,
    },
    title: {
        marginLeft: THEME.spacing.sm,
        color: THEME.colors.primary,
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.lg,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: THEME.spacing.md,
    },
    button: {
        paddingVertical: THEME.spacing.sm,
        paddingHorizontal: THEME.spacing.lg,
        borderRadius: THEME.radius.md,
        backgroundColor: 'rgba(230, 194, 0, 0.1)',
        minWidth: 80,
        alignItems: 'center',
    },
    buttonMargin: {
        marginLeft: THEME.spacing.sm,
    },
    buttonText: {
        color: THEME.colors.primary,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: 'transparent',
    },
    cancelText: {
        color: THEME.colors.textSecondary,
    },
    destructiveButton: {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
    },
    destructiveText: {
        color: THEME.colors.error,
    },
});
