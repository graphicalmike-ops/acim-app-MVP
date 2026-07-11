// Search bar — Figma component set "Search bar" (node 511:1367).
// "Default" (search icon, tap to submit) vs "Searched" (close icon, tap to
// clear) — driven by whether the currently submitted query matches what's
// in the field, not just by whether the field has text.

import { TextInput, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { SearchIcon, CloseIcon } from '@/components/Icons';
import { RipplePressable } from '@/components/RipplePressable';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  searched?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

// The bar's box is always white (Figma: primary-button-bg, same value in both
// themes — see constants/Colors.ts) even in dark mode, so its text/icon/border
// colors are fixed to their light-mode equivalents here rather than pulled
// from useThemeColors(), which would otherwise flip them to dark-mode-on-dark-
// background colors (near-invisible against this always-white box).
export function SearchBar({ value, onChangeText, onSubmit, onClear, searched, placeholder = 'Buscar', autoFocus }: Props) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.primaryButtonBg, borderColor: Colors.darkOutline }]}>
      <TextInput
        style={[styles.input, { color: Colors.fontColorPrimary }]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={Colors.fontColorGray}
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {/* Fixed to the same footprint in both states — a larger touch target
          (via hitSlop, not a bigger box) keeps the bar's height constant when
          swapping icons. A bigger *layout* box here previously made the whole
          bar grow on focus, since the row has no fixed height. The box is
          sized bigger than the 20px icon so the circular ripple clip doesn't
          cut into the icon's corners. */}
      {searched ? (
        <RipplePressable
          style={styles.iconWrap}
          hitSlop={10}
          centered
          instant
          rippleColor={Colors.primaryButtonPressed}
          onPress={handleClear}
        >
          {({ pressed }) => <CloseIcon size={12} color={pressed ? Colors.fontColorGray : Colors.fontColorPrimary} />}
        </RipplePressable>
      ) : (
        <RipplePressable
          style={styles.iconWrap}
          hitSlop={10}
          centered
          instant
          rippleColor={Colors.primaryButtonPressed}
          onPress={onSubmit}
        >
          {({ pressed }) => <SearchIcon size={20} color={pressed ? Colors.fontColorGray : Colors.fontColorPrimary} />}
        </RipplePressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 24,
  },
  input: {
    flex: 1,
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 16,
    padding: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
