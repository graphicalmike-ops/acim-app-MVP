import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

const THEME_KEY = 'acim_theme';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Theme is fully manual and independent of the OS setting — defaults to
  // light until the user toggles it, then persists that choice for future
  // sessions (no re-deriving from the system scheme).
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((value) => {
      if (value === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
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
  savedHighlight: Colors.savedHighlight,
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
  savedHighlight: Colors.savedHighlightDark,
};

export function useThemeColors() {
  const { isDark } = useTheme();
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}
