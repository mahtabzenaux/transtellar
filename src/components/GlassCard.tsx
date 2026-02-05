import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { THEME } from '../theme/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

const GlassCard = ({ children, style }: GlassCardProps) => {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
};

export default GlassCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: THEME.colors.glass,
        borderRadius: THEME.radius.lg,
        padding: THEME.spacing.lg,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
});
