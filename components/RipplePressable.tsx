import { useRef } from 'react';
import { Pressable, PressableProps, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

type Props = PressableProps & {
  rippleColor?: string;
  // Origin the ripple on the button's own center instead of the touch point.
  // Needed for small icon buttons with a hitSlop wider than their visual box —
  // otherwise a tap in the slop area reports a location outside the box, and
  // the ripple both starts off-center and needs to be huge to reach it.
  centered?: boolean;
  // Fill/clear the ripple instantly instead of animating scale-in/opacity-out.
  // The fill itself still shows on press — only the growth/fade motion is skipped.
  instant?: boolean;
};

export function RipplePressable({ rippleColor = Colors.primaryButtonPressed, centered = false, instant = false, onPressIn, onPressOut, onLayout, children, ...rest }: Props) {
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
    // Clamp to the box even when the touch landed in a hitSlop margin outside it.
    const x = centered ? width / 2 : Math.min(Math.max(e.nativeEvent.locationX, 0), width);
    const y = centered ? height / 2 : Math.min(Math.max(e.nativeEvent.locationY, 0), height);
    // Diameter needed to reach the farthest corner from the touch point
    const size = 2 * Math.sqrt(Math.max(x, width - x) ** 2 + Math.max(y, height - y) ** 2);
    rippleSize.value = size;
    originX.value = x;
    originY.value = y;
    opacity.value = 1;
    if (instant) {
      scale.value = 1;
    } else {
      scale.value = 0;
      scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    opacity.value = instant ? 0 : withTiming(0, { duration: 200 });
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
