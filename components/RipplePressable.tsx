import { useRef } from 'react';
import { Pressable, PressableProps, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

type Props = PressableProps & {
  rippleColor?: string;
};

export function RipplePressable({ rippleColor = Colors.buttonPressed, onPressIn, onPressOut, onLayout, children, ...rest }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const rippleSize = useSharedValue(0);
  const dimensions = useRef({ width: 0, height: 0 });

  const rippleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: rippleSize.value,
    height: rippleSize.value,
    borderRadius: rippleSize.value / 2,
    backgroundColor: rippleColor,
    left: originX.value - rippleSize.value / 2,
    top: originY.value - rippleSize.value / 2,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    pointerEvents: 'none',
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    dimensions.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
    onLayout?.(e);
  };

  const handlePressIn = (e: GestureResponderEvent) => {
    const { width, height } = dimensions.current;
    const x = e.nativeEvent.locationX;
    const y = e.nativeEvent.locationY;
    // Diameter needed to reach the farthest corner from the touch point
    const size = 2 * Math.sqrt(Math.max(x, width - x) ** 2 + Math.max(y, height - y) ** 2);
    rippleSize.value = size;
    originX.value = x;
    originY.value = y;
    scale.value = 0;
    opacity.value = 1;
    scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    opacity.value = withTiming(0, { duration: 200 });
    onPressOut?.(e);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onLayout={handleLayout} {...rest}>
      {(state) => (
        <>
          <Animated.View style={rippleStyle} />
          {typeof children === 'function' ? (children as (s: typeof state) => React.ReactNode)(state) : children}
        </>
      )}
    </Pressable>
  );
}
