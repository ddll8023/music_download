const { resolve } = require('path');
const { defineConfig, externalizeDepsPlugin } = require('electron-vite');
const vue = require('@vitejs/plugin-vue');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const tailwindConfig = require(resolve(__dirname, '..', 'sys_vue', 'tailwind.config.js'));
const rawConfig = tailwindConfig.__esModule ? tailwindConfig.default : tailwindConfig;
const sysVueRoot = resolve(__dirname, '..', 'sys_vue');
const resolvedTailwindConfig = {
  ...rawConfig,
  content: rawConfig.content.map(p => resolve(sysVueRoot, p)),
};

module.exports = defineConfig({
  main: {
    build: {
      outDir: resolve(__dirname, 'dist/main'),
      rollupOptions: {
        input: resolve(__dirname, 'main.js'),
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    build: {
      outDir: resolve(__dirname, 'dist/preload'),
      rollupOptions: {
        input: resolve(__dirname, 'preload.js'),
      },
    },
  },
  renderer: {
    root: resolve(__dirname, '..', 'sys_vue'),
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, '..', 'sys_vue', 'src'),
        jsmediatags: resolve(__dirname, '..', 'sys_vue', 'node_modules', 'jsmediatags', 'dist', 'jsmediatags.min.js'),
      },
    },
    css: {
      postcss: {
        plugins: [
          tailwindcss({ config: resolvedTailwindConfig }),
          autoprefixer(),
        ],
      },
    },
    server: {
      port: 3493,
    },
    build: {
      outDir: resolve(__dirname, 'dist/renderer'),
      rollupOptions: {
        input: resolve(__dirname, '..', 'sys_vue', 'index.html'),
      },
    },
  },
});
