import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';
import { THEME } from '../theme/theme';
import { H1, Body } from './Typography';
import { Icon } from './Icon';

const { width, height } = Dimensions.get('window');

interface Props {
    onAnimationComplete: () => void;
}

export const AnimatedSplashScreen = ({ onAnimationComplete }: Props) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const textFadeAnim = useRef(new Animated.Value(0)).current;
    const ringAnim = useRef(new Animated.Value(0)).current;
    const exitAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Start animation sequence
        Animated.sequence([
            // Init reveal
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
            ]),
            // Text reveal
            Animated.timing(textFadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            // Pulse ring
            Animated.loop(
                Animated.sequence([
                    Animated.timing(ringAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ]),
                { iterations: 2 }
            ),
            // Exit sequence
            Animated.timing(exitAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onAnimationComplete();
        });
    }, []);

    const ringScale = ringAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.5],
    });

    const ringOpacity = ringAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 0],
    });

    return (
        <Animated.View style={[styles.container, { opacity: exitAnim }]}>
            <StatusBar hidden />

            {/* Background elements */}
            <View style={styles.background}>
                <View style={[styles.circle, { top: -50, left: -50, backgroundColor: 'rgba(230, 194, 0, 0.05)' }]} />
                <View style={[styles.circle, { bottom: -100, right: -100, backgroundColor: 'rgba(230, 194, 0, 0.03)' }]} />
            </View>

            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    {/* Pulsing ring effect */}
                    <Animated.View
                        style={[
                            styles.ring,
                            {
                                transform: [{ scale: ringScale }],
                                opacity: ringOpacity,
                            },
                        ]}
                    />

                    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                        <Icon name="shield" size={60} color={THEME.colors.primary} />
                    </Animated.View>
                </View>

                <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
                    <H1 style={styles.title}>TRANSTELLAR</H1>
                    <Body style={styles.subtitle}>SECURED ETHEREAL VAULT</Body>
                </Animated.View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: THEME.colors.background,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    circle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: THEME.spacing.xl,
    },
    ring: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: THEME.colors.primary,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        letterSpacing: 8,
        color: THEME.colors.text,
        marginBottom: THEME.spacing.xs,
    },
    subtitle: {
        letterSpacing: 2,
        fontSize: 10,
        color: THEME.colors.primary,
        fontFamily: THEME.typography.fonts.heading,
        opacity: 0.8,
    },
});
