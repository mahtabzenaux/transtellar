import React from 'react';
import { TextInput, StyleSheet, View, ViewStyle, TextInputProps } from 'react-native';
import { THEME } from '../theme/theme';
import { Caption, BodySmall } from './Typography';

interface GothicInputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const GothicInput = ({ label, error, containerStyle, ...props }: GothicInputProps) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Caption style={styles.label} color={THEME.colors.primary}>
                    {label.toUpperCase()}
                </Caption>
            )}
            <View style={[
                styles.inputContainer,
                error ? styles.inputError : null,
                props.multiline && styles.multilineContainer
            ]}>
                <TextInput
                    style={[styles.input, props.multiline && styles.multilineInput]}
                    placeholderTextColor={THEME.colors.textSecondary}
                    selectionColor={THEME.colors.primary}
                    {...props}
                />
            </View>
            {error && (
                <BodySmall style={styles.errorText} color={THEME.colors.error}>
                    {error}
                </BodySmall>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: THEME.spacing.lg,
    },
    label: {
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: THEME.spacing.xs,
        marginLeft: THEME.spacing.xs,
    },
    inputContainer: {
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.md,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        paddingHorizontal: THEME.spacing.md,
        justifyContent: 'center',
    },
    multilineContainer: {
        paddingVertical: THEME.spacing.sm,
    },
    input: {
        height: 56,
        color: THEME.colors.text,
        fontFamily: THEME.typography.fonts.primary,
        fontSize: 16,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: THEME.colors.error,
    },
    errorText: {
        marginTop: THEME.spacing.xs,
        marginLeft: THEME.spacing.xs,
    },
});
