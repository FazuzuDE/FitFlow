const assert = require('node:assert/strict');
const pkg = require('../package.json');
const { expo } = require('../app.json');

assert.equal(expo.version, pkg.version, 'Expo and package versions must match');
assert.equal(pkg.main, 'expo-router/entry', 'Use the Expo Router entry point');
assert.ok(expo.ios?.bundleIdentifier, 'iOS bundle identifier is required');
assert.ok(expo.android?.package, 'Android application ID is required');
console.log(`FitFlow configuration is consistent (${pkg.version}).`);
