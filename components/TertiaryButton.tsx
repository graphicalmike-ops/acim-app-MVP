import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { TipSolidIcon } from '@/components/Icons';
import { RipplePressable } from '@/components/RipplePressable';

type Props = {
  size?: 'md' | 'lg';
  hitSize?: number;
  onPress?: () => void;
  color?: string;
  rippleColor?: string;
  children?: (pressed: boolean) => React.ReactNode;
};

export function TertiaryButton({ size = 'md', hitSize, onPress, color = Colors.fontColorPrimary, rippleColor = Colors.backgroundColor, children }: Props) {
  const containerSize = hitSize ?? (size === 'md' ? 24 : 40);

  return (
    <RipplePressable
      style={{
        width: containerSize,
        height: containerSize,
        borderRadius: containerSize / 2,
        overflow: 'hidden',
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      rippleColor={rippleColor}
      onPress={onPress}
    >
      {({ pressed }) =>
        children ? children(pressed) : size === 'md' ? (
          <View style={styles.iconMd}>
            <Svg width={6} height={10} viewBox="0 0 6 11" fill="none">
              <Path
                d="M5.83594 5.27344C5.99219 5.11719 5.99219 4.89844 5.83594 4.74219L1.27344 0.117188C1.11719 -0.0390625 0.867188 -0.0390625 0.742188 0.117188L0.117188 0.742188C-0.0390625 0.867188 -0.0390625 1.11719 0.117188 1.27344L3.80469 4.99219L0.117188 8.74219C-0.0390625 8.89844 -0.0390625 9.11719 0.117188 9.27344L0.742188 9.89844C0.867188 10.0547 1.11719 10.0547 1.27344 9.89844L5.83594 5.27344Z"
                fill={color}
              />
            </Svg>
          </View>
        ) : (
          <TipSolidIcon size={24} color={color} />
        )
      }
    </RipplePressable>
  );
}

const styles = StyleSheet.create({
  iconMd: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
