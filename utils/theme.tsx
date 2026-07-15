import { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();

  // Theme follows the OS setting by default and re-derives from it on every
  // fresh launch — toggleTheme() only sets a session-only override (never
  // persisted), so a manual choice doesn't survive a restart on purpose.
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);
  const isDark = manualOverride ?? systemScheme === 'dark';

  const toggleTheme = () => setManualOverride(!isDark);

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
