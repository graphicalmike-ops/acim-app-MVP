// Design tokens — sourced from Figma file w4OSlFQqdU4zdzNKvoj8tD
// Variable collection, Mode 1

export const Colors = {
  // Backgrounds
  background: '#F7F3F0',      // Figma: background-color
  backgroundDark: '#EDE3DD',  // Figma: Background-color-dark
  surface: '#FFFFFF',         // Figma: primary-button-bg

  // Text
  textPrimary: '#333333',     // Figma: font-color-primary
  textMuted: '#666666',       // Figma: font-color-gray
  textOnDark: '#F7F3F0',      // Figma: font-color-secondary
  textWhite: '#FFFFFF',       // Figma: font-color-white

  // Buttons
  buttonBg: '#FFFFFF',        // Figma: primary-button-bg
  buttonPressed: '#EBE8E6',   // Figma: primary-button-pressed

  // Borders & dividers
  darkOutline: '#DED5CE',     // Figma: dark-outline
  divider: '#EDE5D8',         // custom — not yet in Figma

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(51, 51, 51, 0.6)',
} as const;
