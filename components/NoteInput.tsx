import { TextInput, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { PlusIcon } from '@/components/Icons';
import { RipplePressable } from '@/components/RipplePressable';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

// Box is always white regardless of theme, same rationale as SearchBar.
export function NoteInput({ value, onChangeText, onSubmit, placeholder = 'Ingresa una nota', autoFocus }: Props) {
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
        returnKeyType="done"
        multiline
        submitBehavior="blurAndSubmit"
        textAlignVertical="center"
      />
      {value.length > 0 && (
        <RipplePressable
          style={styles.iconWrap}
          hitSlop={10}
          centered
          instant
          rippleColor={Colors.primaryButtonPressed}
          onPress={onSubmit}
        >
          {({ pressed }) => <PlusIcon size={32} glyphSize={16} color={pressed ? Colors.fontColorGray : Colors.fontColorPrimary} />}
        </RipplePressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 10,
    gap: 24,
  },
  input: {
    flex: 1,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    padding: 0,
    minHeight: 32,
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
