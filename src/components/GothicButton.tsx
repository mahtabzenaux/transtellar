import React from 'react';
import { Pressable, StyleSheet, TextStyle, ViewStyle, View } from 'react-native';
import { THEME } from '../theme/theme';
import { Body } from './Typography';
import { Icon, IconName } from './Icon';

interface GothicButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    icon?: IconName;
    loading?: boolean;
}

export const GothicButton = ({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    disabled = false,
    icon,
    loading = false
}: GothicButtonProps) => {
    const isPrimary = variant === 'primary';
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';

    const getTextColor = () => {
        if (disabled) return THEME.colors.textSecondary;
        if (isPrimary) return THEME.colors.background;
        if (isOutline || isGhost) return THEME.colors.primary;
        return THEME.colors.text;
    };

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.button,
                styles[variant],
                pressed && styles.pressed,
                disabled && styles.disabled,
                style,
            ]}
        >
            <View style={styles.content}>
                {icon && !loading && (
                    <View style={styles.iconContainer}>
                        <Icon name={icon} size={18} color={getTextColor()} />
                    </View>
                )}
                <Body style={[
                    styles.text,
                    { color: getTextColor() },
                    textStyle
                ] as any}>
                    {title.toUpperCase()}
                </Body>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 52,
        borderRadius: THEME.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        paddingHorizontal: THEME.spacing.lg,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: THEME.spacing.sm,
    },
    primary: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    secondary: {
        backgroundColor: THEME.colors.surfaceLight,
        borderColor: THEME.colors.border,
    },
    outline: {
        backgroundColor: 'transparent',
        borderColor: THEME.colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    disabled: {
        opacity: 0.4,
        backgroundColor: THEME.colors.surfaceLight,
        borderColor: THEME.colors.border,
    },
    text: {
        fontFamily: THEME.typography.fonts.heading,
        fontWeight: '600',
        letterSpacing: 1.2,
        fontSize: 14,
    },
});
