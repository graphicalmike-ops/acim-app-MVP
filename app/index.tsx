import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Colors } from '@/constants/Colors';
import { HeroLogo } from '@/components/HeroLogo';
import { useTheme } from '@/utils/theme';

const heroSourceLight = require('@/assets/images/splash-bg-alt.jpg');
const heroSourceDark = require('@/assets/images/splash-bg-dark-alt.jpg');

export default function SplashScreen() {
  const { isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Always white/light icons here — the splash background is always a busy
    // photographic image (sunset or night sky), never a flat theme color, so
    // icon contrast shouldn't follow the app's light/dark theme (matches the
    // hardcoded <StatusBar style="light" /> below for the same reason).
    NavigationBar.setStyle('dark');
  }, []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => router.replace('/home'), 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ImageBackground
      source={isDark ? heroSourceDark : heroSourceLight}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <View style={styles.overlay} />
      <Animated.View style={[styles.content, { opacity }]}>
        <HeroLogo />
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.30)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
