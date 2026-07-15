// Design tokens — sourced from Figma file w4OSlFQqdU4zdzNKvoj8tD
// Lora (book content) + Merriweather Sans (UI chrome)
// Font family strings must match the keys registered in _layout.tsx useFonts()

import { TextStyle } from 'react-native';

export const FontFamily = {
  serif:         'Lora_400Regular',
  serifMedium:   'Lora_500Medium',
  serifSemibold: 'Lora_600SemiBold',
  serifBold:     'Lora_700Bold',
  sans:          'NotoSans_500Medium',
  sansBold:      'NotoSans_700Bold',
};

// Figma font sizes (px)
export const FontSize = {
  '3xs': 11,  // body-3xs
  '2xs': 12,  // body-2xs
  xs:    14,  // body-xs
  sm:    16,  // body-s
  md:    18,  // body-md
  lg:    20,  // title-md
  xl:    22,  // title-lg
  // No Figma equivalent — display/hero sizes
  '2xl': 28,
  '3xl': 36,
} as const;

// Book fonts (Lora) — for ACIM text content in the reader
// Mirrors Figma: Book fonts/*
export const BookFonts = {
  titleXlBold:     { fontFamily: 'Lora_700Bold',     fontSize: 26 },  // Figma: Book fonts/title-xl-bold
  titleLgBold:     { fontFamily: 'Lora_700Bold',     fontSize: 22 },
  titleLgSemibold: { fontFamily: 'Lora_600SemiBold', fontSize: 22 },
  titleLgMedium:   { fontFamily: 'Lora_500Medium',   fontSize: 22 },
  titleMdSemibold: { fontFamily: 'Lora_600SemiBold', fontSize: 20 },
  titleMdMedium:   { fontFamily: 'Lora_500Medium',   fontSize: 20 },
  bodyMdBold:      { fontFamily: 'Lora_700Bold',     fontSize: 18 },
  bodySRegular:    { fontFamily: 'Lora_400Regular',  fontSize: 18 },
  bodySSeibold:    { fontFamily: 'Lora_600SemiBold', fontSize: 16 },
} as const;

// UI fonts (Merriweather Sans) — for navigation, labels, and UI chrome
// Mirrors Figma: UI fonts/*
export const UIFonts = {
  bodyMdBold:     { fontFamily: 'NotoSans_700Bold',    fontSize: 18 },
  bodySBold:      { fontFamily: 'NotoSans_700Bold',    fontSize: 16 },
  bodySRegular:   { fontFamily: 'NotoSans_500Medium', fontSize: 16 },
  bodyXsBold:     { fontFamily: 'NotoSans_700Bold',    fontSize: 14 },
  bodyXsRegular:  { fontFamily: 'NotoSans_500Medium', fontSize: 14 },
  body2xsBold:    { fontFamily: 'NotoSans_700Bold',    fontSize: 12 },
  body2xsRegular: { fontFamily: 'NotoSans_500Medium', fontSize: 12 },
  body3xsRegular: { fontFamily: 'NotoSans_500Medium', fontSize: 11 },
  // Figma: UI fonts / caps-body-xs-* — small caps variants (approximated with uppercase)
  capsBodyXsBold:    { fontFamily: 'NotoSans_700Bold',    fontSize: 14, textTransform: 'uppercase' as const },
  capsBodyXsRegular: { fontFamily: 'NotoSans_500Medium', fontSize: 14, textTransform: 'uppercase' as const },
} as const;

// Semantic typography — used throughout app screens
// displayLarge / displayMedium have no Figma equivalent (hero/splash sizes)
export const Typography = {
  displayLarge: {
    fontFamily: 'Lora_700Bold',
    fontSize: 36,
    lineHeight: 46,
  } as TextStyle,

  displayMedium: {
    fontFamily: 'Lora_700Bold',
    fontSize: 28,
    lineHeight: 36,
  } as TextStyle,

  // Figma: Book fonts / title-lg-bold
  headlineLarge: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    lineHeight: 30,
  } as TextStyle,

  // Figma: Book fonts / title-lg-semibold
  headlineMedium: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 22,
    lineHeight: 30,
  } as TextStyle,

  // Figma: Book fonts / title-md-semibold
  headlineSmall: {
    fontFamily: 'Lora_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
  } as TextStyle,

  // Figma: Book fonts / body-s-regular (18px Lora)
  bodyLarge: {
    fontFamily: 'Lora_400Regular',
    fontSize: 18,
    lineHeight: 30,
  } as TextStyle,

  // Figma: UI fonts / body-s-regular
  bodySmall: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  // Figma: UI fonts / body-s-bold
  labelLarge: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.3,
  } as TextStyle,

  // Figma: UI fonts / body-xs-regular
  labelMedium: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  // Figma: UI fonts / body-3xs-regular (bold variant for overline labels)
  overline: {
    fontFamily: 'NotoSans_700Bold',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 2,
  } as TextStyle,
} as const;
