import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Animated, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { TheoryIcon, ExercizesIcon, TeacherIcon, SupplementalIcon, TipSolidIcon, LightModeIcon, DarkModeIcon, SearchIcon, BookmarkIcon, NotesIcon } from '@/components/Icons';
import { TertiaryButton } from '@/components/TertiaryButton';
import { HeroLogo } from '@/components/HeroLogo';
import { loadLastRead, clearLastRead, LastReadState } from '@/utils/lastRead';
import { RipplePressable } from '@/components/RipplePressable';
import { useTheme } from '@/utils/theme';
import { useBookmarks } from '@/utils/bookmarks';

const BUTTONS = [
  { Icon: TheoryIcon,       label: 'Libro de Texto',         anchor: 'theory'     },
  { Icon: ExercizesIcon,    label: 'Libro de Ejercicios',    anchor: 'workbook'   },
  { Icon: TeacherIcon,      label: 'Manual para el Maestro', anchor: 'mft'        },
  { Icon: SupplementalIcon, label: 'Suplementos',            anchor: 'supplement' },
];

const heroSourceLight = require('@/assets/images/splash-bg-alt.jpg');
const heroSourceDark = require('@/assets/images/splash-bg-dark-alt.jpg');

export default function HomeScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { bottom: bottomInset } = useSafeAreaInsets();

  // Crossfades the hero image on every theme change, not just the first —
  // both images stay mounted (no source swap) so there's nothing to
  // decode/load mid-transition, just an opacity animation on top.
  const heroFadeAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(heroFadeAnim, { toValue: isDark ? 1 : 0, duration: 350, useNativeDriver: true }).start();
  }, [isDark, heroFadeAnim]);

  const t = isDark ? {
    pageBg:          Colors.backgroundColorDark,
    topBarBg:        Colors.backgroundColorDark,
    topBarIconColor: Colors.fontColorSecondary,
    topBarRipple:    Colors.primaryButtonBgDark,
    btnBg:           Colors.backgroundColorDark,
    btnBorder:       Colors.darkOutline,
    btnIconColor:    Colors.fontColorSecondary,
    btnLabelColor:   Colors.fontColorSecondary,
    btnRipple:       Colors.primaryButtonBgDark,
  } : {
    pageBg:          Colors.backgroundColor,
    topBarBg:        Colors.backgroundColor,
    topBarIconColor: Colors.fontColorPrimary,
    topBarRipple:    Colors.darkerBackgroundColor,
    btnBg:           Colors.primaryButtonBg,
    btnBorder:       Colors.darkOutline,
    btnIconColor:    Colors.fontColorPrimary,
    btnLabelColor:   Colors.fontColorPrimary,
    btnRipple:       Colors.primaryButtonPressed,
  };
  const { clearAllBookmarks } = useBookmarks();
  const [lastRead, setLastRead] = useState<LastReadState | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [loadBarVisible, setLoadBarVisible] = useState(false);

  const handleResetAll = useCallback(() => {
    Alert.alert(
      '¿Restablecer todo?',
      'Se borrará el último capítulo leído y todos los versos guardados junto con sus notas. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            await clearLastRead();
            setLastRead(null);
            clearAllBookmarks();
          },
        },
      ]
    );
  }, [clearAllBookmarks]);
  const loadBarAnim = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();

  const startLoadBar = useCallback(() => {
    setLoadBarVisible(true);
    loadBarAnim.setValue(0);
    Animated.timing(loadBarAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [loadBarAnim]);

  useFocusEffect(
    useCallback(() => {
      loadLastRead().then(setLastRead);
      setNavigating(false);
      setLoadBarVisible(false);
      loadBarAnim.stopAnimation();
      loadBarAnim.setValue(0);
    }, [loadBarAnim])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.pageBg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={t.topBarBg} />

      {/* Top bar (donation/tip + light/dark toggle) hidden — may be restored later
      <View style={[styles.topBar, { backgroundColor: t.topBarBg }]}>
        <TertiaryButton hitSize={40} rippleColor={t.topBarRipple} onPress={async () => { await clearLastRead(); setLastRead(null); }}>
          {(pressed) => <TipSolidIcon size={24} color={pressed ? (isDark ? Colors.fontColorWhite : Colors.fontColorPrimary) : t.topBarIconColor} />}
        </TertiaryButton>
        <TertiaryButton hitSize={40} rippleColor={t.topBarRipple} onPress={toggleTheme}>
          {(pressed) => isDark
            ? <LightModeIcon size={20} color={pressed ? Colors.fontColorWhite : t.topBarIconColor} />
            : <DarkModeIcon size={20} color={pressed ? Colors.fontColorPrimary : t.topBarIconColor} />
          }
        </TertiaryButton>
      </View>
      */}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero card */}
        <View style={[styles.heroCard, { borderColor: isDark ? Colors.darkOutline : 'transparent' }]}>
          <Image
            source={heroSourceLight}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
            resizeMode="cover"
          />
          <Animated.Image
            source={heroSourceDark}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: heroFadeAnim }]}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFill, styles.heroOverlay]} />

          <View style={styles.heroTipButton}>
            <TertiaryButton hitSize={40} rippleColor={t.topBarRipple} onPress={handleResetAll}>
              {(pressed) => <TipSolidIcon size={24} color={pressed ? (isDark ? Colors.fontColorWhite : Colors.fontColorPrimary) : Colors.fontColorWhite} />}
            </TertiaryButton>
          </View>

          <View style={styles.heroThemeToggle}>
            <TertiaryButton hitSize={40} rippleColor={t.topBarRipple} onPress={toggleTheme}>
              {(pressed) => isDark
                ? <LightModeIcon size={20} color={pressed ? Colors.fontColorWhite : t.topBarIconColor} />
                : <DarkModeIcon size={20} color={pressed ? Colors.fontColorPrimary : Colors.fontColorSecondary} />
              }
            </TertiaryButton>
          </View>

          <View style={styles.heroContent}>
            {/* Logo — top half */}
            <View style={styles.heroLogo}>
              <HeroLogo />
            </View>

            {/* Highlighted item — continue reading / welcome */}
            <View style={styles.highlighted}>
              <View style={styles.highlightPlaceholders}>
                <TertiaryButton hitSize={40} rippleColor={t.topBarRipple} onPress={() => router.push('/search')}>
                  {(pressed) => <SearchIcon size={20} color={pressed ? (isDark ? Colors.fontColorWhite : Colors.fontColorPrimary) : Colors.fontColorSecondary} />}
                </TertiaryButton>
                <TertiaryButton hitSize={40} rippleColor={t.topBarRipple} onPress={() => router.push('/bookmarks')}>
                  {(pressed) => <BookmarkIcon size={20} color={pressed ? (isDark ? Colors.fontColorWhite : Colors.fontColorPrimary) : Colors.fontColorSecondary} />}
                </TertiaryButton>
                {/* Notes icon hidden — may be restored later
                <TertiaryButton hitSize={40} rippleColor={t.topBarRipple} onPress={() => {}}>
                  {(pressed) => <NotesIcon size={20} color={pressed ? (isDark ? Colors.fontColorWhite : Colors.fontColorPrimary) : Colors.fontColorSecondary} />}
                </TertiaryButton>
                */}
              </View>
              <View style={styles.highlightMeta}>
                <Text style={styles.highlightLabel}>{lastRead ? 'Continúa leyendo' : 'Te damos la bienvenida:'}</Text>
                {lastRead && <Text style={styles.highlightChapter}>{lastRead.breadcrumb}</Text>}
              </View>
              {lastRead && <Text style={styles.highlightQuote}>{lastRead.title}</Text>}
              <RipplePressable
                style={({ pressed }) => [styles.sigueBtn, pressed && styles.sigueBtnPressed]}
                rippleColor={t.btnRipple}
                onPress={() => {
                  if (navigating) return;
                  setNavigating(true);
                  startLoadBar();
                  // Long enough for the load bar to actually be seen before this screen unmounts —
                  // 100ms (used elsewhere for pure ripple-feedback delays) was imperceptible here.
                  setTimeout(() => lastRead
                    ? router.push(`/reader?book=${lastRead.bookId}&anchor=${lastRead.anchor}`)
                    : router.push('/reader?book=theory&anchor=theory-prefacio')
                  , 200);
                }}
              >
                {({ pressed }) => (
                  <Text style={[styles.sigueBtnText, pressed && !isDark && { color: Colors.fontColorPrimary }]}>
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
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: t.btnBg, borderColor: t.btnBorder }]}
              rippleColor={t.btnRipple}
              onPress={() => { if (navigating) return; setNavigating(true); startLoadBar(); setTimeout(() => router.push(`/contents?anchor=${anchor}`), 200); }}
            >
              <View style={styles.primaryBtnIcon}>
                <Icon size={16} color={t.btnIconColor} />
              </View>
              <Text style={[styles.primaryBtnLabel, { color: t.btnLabelColor }]}>{label}</Text>
            </RipplePressable>
          ))}
        </View>
      </ScrollView>
      {loadBarVisible && (
        <View style={[styles.loadBarTrack, { bottom: bottomInset, backgroundColor: isDark ? 'transparent' : Colors.darkOutline }]}>
          <Animated.View style={[
            styles.loadBarFill,
            { backgroundColor: isDark ? Colors.primaryButtonBgDark : Colors.fontColorPrimary },
            { transform: [{ translateX: loadBarAnim.interpolate({ inputRange: [0, 1], outputRange: [-screenWidth, 0] }) }] },
          ]} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    paddingHorizontal: 24,
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 20,
  },

  // Hero card
  heroCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  heroTipButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  heroThemeToggle: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Logo section
  heroLogo: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  // Highlighted item
  highlighted: {
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.30)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  highlightPlaceholders: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    gap: 0,
    zIndex: 1,
    paddingTop: 2,
    paddingRight: 2,
  },
  highlightMeta: {
    gap: 8,
  },
  highlightLabel: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 12,
    color: Colors.fontColorSecondary,
  },
  highlightChapter: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 12,
    color: Colors.fontColorSecondary,
  },
  highlightQuote: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    color: Colors.fontColorSecondary,
    marginTop: 16,
  },
  sigueBtn: {
    marginTop: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.backgroundColor,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  sigueBtnPressed: {},
  sigueBtnText: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    color: Colors.fontColorSecondary,
  },

  // Primary buttons
  buttons: {
    gap: 12,
  },
  primaryBtn: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 24,
  },
  primaryBtnIcon: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  loadBarTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    overflow: 'hidden',
  },
  loadBarFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
  },
  primaryBtnLabel: {
    flex: 1,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
  },
});
