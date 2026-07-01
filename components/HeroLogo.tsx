import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { StarIcon } from '@/components/Icons';

const TITLE_FONT_SIZE = 38;
const STAR_SIZE = Math.round(TITLE_FONT_SIZE * (58 / 38));

export function HeroLogo() {
  return (
    <View style={styles.container}>
      <StarIcon size={STAR_SIZE} />
      <Text allowFontScaling={false} style={styles.title}>Un Curso{'\n'}De Milagros</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontFamily: 'Lora_500Medium',
    fontSize: TITLE_FONT_SIZE,
    color: Colors.fontColorSecondary,
    textAlign: 'center',
    letterSpacing: 2.28,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
