import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { BookmarkIcon, NotesIcon, ShareIcon } from '@/components/Icons';
import { RipplePressable } from '@/components/RipplePressable';

type Variant = 'save' | 'notes' | 'share';

type Props = {
  variant: Variant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const LABELS: Record<Variant, string> = {
  save: 'Guardar',
  notes: 'Nota',
  share: 'Compartir',
};

// Box is always white regardless of theme, same rationale as NoteInput/SearchBar —
// it was previously pulling icon/text color from useThemeColors(), which flips to
// white in dark mode while the box itself stays fixed white, making them disappear.
export function ReaderToolButton({ variant, onPress, style }: Props) {
  const Icon = variant === 'save' ? BookmarkIcon : variant === 'notes' ? NotesIcon : ShareIcon;

  return (
    <RipplePressable
      style={[styles.container, { backgroundColor: Colors.primaryButtonBg, borderColor: Colors.darkOutline }, style]}
      rippleColor={Colors.darkOutline}
      onPress={onPress}
    >
      <Icon size={16} color={Colors.fontColorPrimary} />
      <Text style={[styles.label, { color: Colors.fontColorPrimary }]}>{LABELS[variant]}</Text>
    </RipplePressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  label: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
  },
});
