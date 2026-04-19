const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
console.log("platforms:", JSON.stringify(config.resolver.platforms, null, 2));
console.log("sourceExts:", JSON.stringify(config.resolver.sourceExts, null, 2));
