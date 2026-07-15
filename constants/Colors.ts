// Design tokens — sourced from Figma file w4OSlFQqdU4zdzNKvoj8tD
// Variable collection, Mode 1

export const Colors = {
  backgroundColor: '#F7F3F0',         // Figma: background-color
  darkerBackgroundColor: '#EDE3DD',   // Figma: darker-background-color
  backgroundColorDark: '#29264D',      // Figma: background-color-dark
  primaryButtonBg: '#FFFFFF',         // Figma: primary-button-bg
  primaryButtonBgDark: '#99794D',     // Figma: primary-button-bg-dark
  primaryButtonPressed: '#EBE8E6',    // Figma: primary-button-pressed
  fontColorPrimary: '#333333',        // Figma: font-color-primary
  fontColorSecondary: '#F7F3F0',      // Figma: font-color-secondary
  fontColorGray: '#666666',           // Figma: font-color-gray
  fontColorWhite: '#FFFFFF',          // Figma: font-color-white
  textHighlight: '#803000',           // Figma: Text-highlight
  darkOutline: '#DED5CE',             // Figma: dark-outline

  // Custom — not yet in Figma
  divider: '#EDE5D8',
  savedHighlight: 'rgba(255, 224, 102, 0.32)',      // translucent highlighter yellow (light mode)
  savedHighlightDark: 'rgba(255, 224, 102, 0.32)',  // translucent highlighter yellow (dark mode, keeps white text legible)

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(51, 51, 51, 0.6)',
} as const;
