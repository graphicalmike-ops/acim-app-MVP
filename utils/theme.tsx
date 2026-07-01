import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

const KEY = 'acim_theme';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(val => {
      if (val === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

const LIGHT_COLORS = {
  backgroundColor: Colors.backgroundColor,
  darkerBackgroundColor: Colors.darkerBackgroundColor,
  fontColorPrimary: Colors.fontColorPrimary,
  fontColorGray: Colors.fontColorGray,
  darkOutline: Colors.darkOutline,
  primaryButtonBg: Colors.primaryButtonBg,
  overlay: Colors.overlay,
  ntWordColor: Colors.textHighlight,
  pressedIconColor: Colors.fontColorPrimary,
};

const DARK_COLORS = {
  backgroundColor: Colors.backgroundColorDark,
  darkerBackgroundColor: Colors.primaryButtonBgDark,
  fontColorPrimary: Colors.fontColorWhite,
  fontColorGray: Colors.fontColorSecondary,
  darkOutline: Colors.darkOutline,
  primaryButtonBg: Colors.primaryButtonBg,
  overlay: Colors.overlay,
  ntWordColor: Colors.fontColorWhite,
  pressedIconColor: Colors.primaryButtonBgDark,
};

export function useThemeColors() {
  const { isDark } = useTheme();
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}
