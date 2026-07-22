/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // OLD SCHEME — mirrors constants/Colors.ts via the CSS vars in
      // global.css (see that file's comment). Prefixed `old-` to avoid
      // colliding with the new semantic tokens coming from Figma; delete
      // once no screen uses an `old-*` class anymore.
      colors: {
        'old-background': 'var(--old-background-color)',
        'old-darker-background': 'var(--old-darker-background-color)',
        'old-font-primary': 'var(--old-font-color-primary)',
        'old-font-gray': 'var(--old-font-color-gray)',
        'old-dark-outline': 'var(--old-dark-outline)',
        'old-primary-button-bg': 'var(--old-primary-button-bg)',
        'old-overlay': 'var(--old-overlay)',
        'old-nt-word': 'var(--old-nt-word-color)',
        'old-pressed-icon': 'var(--old-pressed-icon-color)',
        'old-saved-highlight': 'var(--old-saved-highlight)',

        // RNR/shadcn placeholder slot names — see global.css comment.
        // These are what components/ui/* (Button, Input, Text, ...)
        // actually render with by default; currently aliased to the old
        // scheme so they match the current look out of the box.
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: 'var(--destructive)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      // Mirrors constants/Typography.ts's FontFamily map.
      fontFamily: {
        serif: ['Lora_400Regular'],
        'serif-medium': ['Lora_500Medium'],
        'serif-semibold': ['Lora_600SemiBold'],
        'serif-bold': ['Lora_700Bold'],
        sans: ['NotoSans_500Medium'],
        'sans-bold': ['NotoSans_700Bold'],
      },
    },
  },
  plugins: [],
};
