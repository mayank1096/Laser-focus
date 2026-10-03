module.exports = {
  preset: '@react-native/jest-preset',
  resolver: 'react-native-reanimated/jest/resolver',
  setupFiles: [
    './node_modules/react-native-gesture-handler/jestSetup.js',
    './jest.setup.js',
  ],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*)/)',
  ],
};
