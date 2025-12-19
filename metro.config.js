const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for rxjs tslib compatibility issue on web
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
