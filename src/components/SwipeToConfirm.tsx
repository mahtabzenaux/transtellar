import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { THEME } from '../theme/theme';
import { Body } from '../components/Typography';
import { Icon } from './Icon';

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width - THEME.spacing.xl * 2;
const KNOB_SIZE = 56;
const SWIPE_RANGE = BUTTON_WIDTH - KNOB_SIZE - 12;

interface SwipeToConfirmProps {
    onConfirm: () => void;
    title?: string;
}

export const SwipeToConfirm = ({
    onConfirm,
    title = 'Swipe to Confirm',
}: SwipeToConfirmProps) => {
    const translateX = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = Math.min(
                Math.max(0, event.translationX),
                SWIPE_RANGE
            );
        })
        .onEnd(() => {
            if (translateX.value > SWIPE_RANGE * 0.8) {
                translateX.value = withSpring(SWIPE_RANGE);
                runOnJS(onConfirm)();
            } else {
                translateX.value = withSpring(0);
            }
        });

    const knobStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [0, SWIPE_RANGE * 0.6],
            [1, 0],
            Extrapolate.CLAMP
        ),
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.textContainer, textStyle]}>
                <Body style={styles.text}>{title.toUpperCase()}</Body>
            </Animated.View>

            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.knob, knobStyle]}>
                    <Icon name="arrow-right" size={24} color={THEME.colors.background} />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: BUTTON_WIDTH,
        height: 68,
        backgroundColor: 'rgba(230, 194, 0, 0.05)',
        borderRadius: THEME.radius.full,
        justifyContent: 'center',
        padding: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(230, 194, 0, 0.2)',
    },
    textContainer: {
        position: 'absolute',
        width: '100%',
        alignItems: 'center',
    },
    text: {
        color: THEME.colors.primary,
        fontFamily: THEME.typography.fonts.heading,
        fontWeight: '700',
        letterSpacing: 2,
        fontSize: 14,
    },
    knob: {
        width: KNOB_SIZE,
        height: KNOB_SIZE,
        backgroundColor: THEME.colors.primary,
        borderRadius: THEME.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
});
