import { Pressable, PressableProps, GestureResponderEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

type Props = PressableProps & {
  rippleColor?: string;
};

const RIPPLE_SIZE = 1000;

export function RipplePressable({ rippleColor = Colors.buttonPressed, onPressIn, onPressOut, children, ...rest }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  const rippleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    backgroundColor: rippleColor,
    left: originX.value - RIPPLE_SIZE / 2,
    top: originY.value - RIPPLE_SIZE / 2,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    pointerEvents: 'none',
  }));

  const handlePressIn = (e: GestureResponderEvent) => {
    originX.value = e.nativeEvent.locationX;
    originY.value = e.nativeEvent.locationY;
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
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
      {(state) => (
        <>
          <Animated.View style={rippleStyle} />
          {typeof children === 'function' ? (children as (s: typeof state) => React.ReactNode)(state) : children}
        </>
      )}
    </Pressable>
  );
}
