const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['components/ExerciseLibrary.tsx'],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
  {
    files: ['components/Workout.tsx'],
    rules: { 'react-hooks/purity': 'off' },
  },
  { ignores: ['dist/**', 'coverage/**', '.npm-cache/**', '.tools/**'] },
]);
