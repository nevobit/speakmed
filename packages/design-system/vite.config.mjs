import {readFileSync} from 'fs';

import {defineConfig} from 'vite';
import {replaceCodePlugin} from 'vite-plugin-replace';
import { resolve } from 'path';
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)),
);

// eslint-disable-next-line import/no-default-export
export default defineConfig(() => ({
  plugins: [
    replaceCodePlugin({
      replacements: [
        {
          from: '{{PROJECT_VERSION}}',
          to: pkg.version,
        },
      ],
    }),
  ],
  css: {
    build: {
      lib: {
        entry: resolve(__dirname, 'web/styles/index.css'),
        name: 'MyDesignSystem',
        fileName: (format) => `my-design-system.${format}.js`,
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'web/styles/index.css'),
        },
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'index.css') return 'my-design-system.css';
            return assetInfo.name;
          },
        },
      },
    },
    css: {
      preprocessorOptions: {
        css: {
          charset: false,
        },
      },
    },
    modules: {
      globalModulePaths: [/global\.css$/],
    },
  },
  resolve: {
    alias: {
      // Evita que Vite intente resolver módulos de React Native
      'react-native': resolve(__dirname, 'src/web/react-native-stub.js'),
      'react-native-gesture-handler': resolve(
        __dirname,
        'src/web/react-native-gesture-handler-stub.js',
      ),
    },
  },
  optimizeDeps: {
    exclude: ['react-native', 'react-native-gesture-handler'],
  },
}));