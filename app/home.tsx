import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { TheoryIcon, ExercizesIcon, TeacherIcon, SupplementalIcon } from '@/components/Icons';
import { TertiaryButton } from '@/components/TertiaryButton';
import { HeroLogo } from '@/components/HeroLogo';
import { loadLastRead, LastReadState } from '@/utils/lastRead';
import { RipplePressable } from '@/components/RipplePressable';

const BUTTONS = [
  { Icon: TheoryIcon,       label: 'Libro de Texto',         anchor: 'theory'     },
  { Icon: ExercizesIcon,    label: 'Libro de Ejercicios',    anchor: 'workbook'   },
  { Icon: TeacherIcon,      label: 'Manual para el Maestro', anchor: 'mft'        },
  { Icon: SupplementalIcon, label: 'Suplementos',            anchor: 'supplement' },
];

const heroSource = require('@/assets/images/splash-bg.jpg');

export default function HomeScreen() {
  const [lastRead, setLastRead] = useState<LastReadState | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadLastRead().then(setLastRead);
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      <View style={styles.content}>
        {/* Top bar — debug: tap to reset keep-reading state */}
        <View style={styles.topBar}>
          <TertiaryButton size="lg" rippleColor={Colors.backgroundDark} />
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <Image
            source={heroSource}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFill, styles.heroOverlay]} />

          <View style={styles.heroContent}>
            {/* Logo — top half */}
            <View style={styles.heroLogo}>
              <HeroLogo />
            </View>

            {/* Highlighted item — continue reading / welcome */}
            <View style={styles.highlighted}>
              <View style={styles.highlightMeta}>
                <Text style={styles.highlightLabel}>{lastRead ? 'Continúa leyendo' : 'Te damos la bienvenida:'}</Text>
                {lastRead && <Text style={styles.highlightChapter}>{lastRead.breadcrumb}</Text>}
              </View>
              {lastRead && <Text style={styles.highlightQuote}>{lastRead.title}</Text>}
              <RipplePressable
                style={({ pressed }) => [styles.sigueBtn, pressed && styles.sigueBtnPressed]}
                rippleColor={Colors.background}
                onPress={() => lastRead
                  ? router.push(`/reader?book=${lastRead.bookId}&anchor=${lastRead.anchor}`)
                  : router.push('/reader?book=theory&anchor=theory-prefacio')
                }
              >
                {({ pressed }) => (
                  <Text style={[styles.sigueBtnText, pressed && styles.sigueBtnTextPressed]}>
                    {lastRead ? 'Sigue leyendo' : 'Comienza el Curso'}
                  </Text>
                )}
              </RipplePressable>
            </View>
          </View>
        </View>

        {/* Primary buttons */}
        <View style={styles.buttons}>
          {BUTTONS.map(({ Icon, label, anchor }, i) => (
            <RipplePressable
              key={i}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={() => router.push(`/contents?anchor=${anchor}`)}
            >
              <Icon size={16} color={Colors.textPrimary} />
              <Text style={styles.primaryBtnLabel}>{label}</Text>
            </RipplePressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Top bar
  topBar: {
    height: 48,
    backgroundColor: Colors.background,
    paddingVertical: 4,
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  // Hero card
  heroCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Logo section
  heroLogo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  // Highlighted item
  highlighted: {
    backgroundColor: 'rgba(0,0,0,0.30)',
    padding: 20,
  },
  highlightMeta: {
    gap: 8,
  },
  highlightLabel: {
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 12,
    color: Colors.textOnDark,
  },
  highlightChapter: {
    fontFamily: 'MerriweatherSans_700Bold',
    fontSize: 12,
    color: Colors.textOnDark,
  },
  highlightQuote: {
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 16,
    color: Colors.textOnDark,
    marginTop: 28,
  },
  sigueBtn: {
    marginTop: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  sigueBtnPressed: {},
  sigueBtnText: {
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 14,
    color: Colors.textOnDark,
  },
  sigueBtnTextPressed: {
    color: Colors.textPrimary,
  },

  // Primary buttons
  buttons: {
    gap: 12,
  },
  primaryBtn: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.darkOutline,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 24,
  },
  primaryBtnPressed: {},
  primaryBtnLabel: {
    fontFamily: 'MerriweatherSans_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
