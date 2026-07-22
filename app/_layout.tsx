import '../global.css';
import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useFonts } from 'expo-font';
import { ThemeProvider, useTheme } from '@/utils/theme';
import { BookmarksProvider } from '@/utils/bookmarks';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Lora_700Bold_Italic,
} from '@expo-google-fonts/lora';
import {
  NotoSans_500Medium,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function NavigationBarSync() {
  const { isDark } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    NavigationBar.setStyle(isDark ? 'dark' : 'light');
  }, [isDark, pathname]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    Lora_700Bold_Italic,
    NotoSans_500Medium,
    NotoSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <BookmarksProvider>
        <NavigationBarSync />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="home" options={{ animation: 'fade', animationTypeForReplace: 'push' }} />
          <Stack.Screen name="contents" options={{ animation: 'fade' }} />
          <Stack.Screen name="bookmarks" options={{ animation: 'fade' }} />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="reader" options={{ animation: 'fade' }} />
        </Stack>
        <StatusBar style="dark" backgroundColor={Colors.darkerBackgroundColor} />
      </BookmarksProvider>
    </ThemeProvider>
  );
}
