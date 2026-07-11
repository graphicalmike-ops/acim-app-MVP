// Learn more https://docs.expo.dev/guides/monorepos/#metro-configuration
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ship the pre-built search index as a binary asset (see scripts/build-search-index.js).
config.resolver.assetExts.push('db');

// expo-sqlite's web build loads its SQLite engine as a .wasm asset — without
// registering the extension, Metro's web bundler can't resolve the import
// inside node_modules/expo-sqlite/web/worker.ts (native/Android is unaffected,
// this only matters for the web preview).
config.resolver.assetExts.push('wasm');

module.exports = config;
