import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay } from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface WaveformBarProps {
    index: number;
}

const WaveformBar = ({ index }: WaveformBarProps) => {
    const height = useSharedValue(5);

    useEffect(() => {
        height.value = withRepeat(
            withDelay(
                index * 100,
                withTiming(20 + Math.random() * 30, { duration: 500 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        height: height.value,
    }));

    return (
        <AnimatedRect
            x={index * 10}
            y={25 - height.value / 2}
            width={6}
            rx={3}
            fill="#3b9eff"
            animatedProps={useAnimatedStyle(() => ({
                height: height.value,
                y: 25 - height.value / 2,
            })) as any}
        />
    );
};

export default function Waveform() {
    return (
        <View style={styles.container}>
            <Svg height="50" width="200" viewBox="0 0 200 50">
                {[...Array(20)].map((_, i) => (
                    <WaveformBar key={i} index={i} />
                ))}
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 50,
        width: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
