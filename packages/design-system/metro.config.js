const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  const { assetExts, sourceExts } = defaultConfig.resolver;

  return {
    transformer: {
      babelTransformerPath: require.resolve(
        'react-native-storybook-transformer',
      ),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      assetExts: [...assetExts, 'txt', 'xml', 'png', 'jpg'],
      sourceExts: [
        ...sourceExts,
        'stories.js',
        'stories.jsx',
        'stories.ts',
        'stories.tsx',
      ],
    },
  };
})();
