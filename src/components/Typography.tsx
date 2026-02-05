import React from 'react';
import { Text, TextStyle, StyleSheet, TextProps, StyleProp } from 'react-native';
import { THEME } from '../theme/theme';

interface TypographyProps extends TextProps {
    children: React.ReactNode;
    style?: StyleProp<TextStyle>;
    color?: string;
}

export const H1 = ({ children, style, color, ...props }: TypographyProps) => (
    <Text style={[styles.h1, { color: color || THEME.colors.text }, style]} {...props}>{children}</Text>
);

export const H2 = ({ children, style, color, ...props }: TypographyProps) => (
    <Text style={[styles.h2, { color: color || THEME.colors.text }, style]} {...props}>{children}</Text>
);

export const H3 = ({ children, style, color, ...props }: TypographyProps) => (
    <Text style={[styles.h3, { color: color || THEME.colors.text }, style]} {...props}>{children}</Text>
);

export const Body = ({ children, style, color, ...props }: TypographyProps) => (
    <Text style={[styles.body, { color: color || THEME.colors.text }, style]} {...props}>{children}</Text>
);

export const BodySmall = ({ children, style, color, ...props }: TypographyProps) => (
    <Text style={[styles.bodySmall, { color: color || THEME.colors.text }, style]} {...props}>{children}</Text>
);

export const Caption = ({ children, style, color, ...props }: TypographyProps) => (
    <Text style={[styles.caption, { color: color || THEME.colors.textSecondary }, style]} {...props}>{children}</Text>
);

const styles = StyleSheet.create({
    h1: THEME.typography.h1 as TextStyle,
    h2: THEME.typography.h2 as TextStyle,
    h3: THEME.typography.h3 as TextStyle,
    body: THEME.typography.body as TextStyle,
    bodySmall: THEME.typography.bodySmall as TextStyle,
    caption: THEME.typography.caption as TextStyle,
});
