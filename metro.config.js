const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix platform-specific resolution in node_modules
config.resolver.sourceExts = [...config.resolver.sourceExts, 'android.js', 'ios.js'];

module.exports = withNativeWind(config, { input: "./global.css" });
