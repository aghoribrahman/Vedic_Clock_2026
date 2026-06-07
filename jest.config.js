/**
 * Jest config — single run covers both buckets:
 *
 *   • Pure-TS math/service tests in `__tests__/*.test.ts`. These don't
 *     import any RN component, so they execute identically under any
 *     preset; we just let jest-expo's babel-jest pipeline handle TS.
 *   • Widget mount tests in `__tests__/*.test.tsx`. These use
 *     @testing-library/react-native and need a real React Native
 *     module registry, which jest-expo provides.
 *
 * transformIgnorePatterns is the standard Expo-RN incantation — by
 * default jest doesn't transform node_modules, but RN ships ES modules,
 * so we have to explicitly allowlist them.
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-clone-referenced-element|@react-native-community|expo(nent)?|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
};
