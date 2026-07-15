import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/utils/theme';
import { UIFonts } from '@/constants/Typography';

type Props = {
  label: string;
};

// The caps, bold, gray "book name" heading used to group content by book —
// shared by the Index (contents.tsx), Search results, and Guardados
// (bookmarks) lists so a future style change only needs to happen here.
export function BookSectionHeading({ label }: Props) {
  const t = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: t.backgroundColor }]}>
      <Text style={[styles.label, { color: t.fontColorGray }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  label: UIFonts.capsBodyXsBold,
});
