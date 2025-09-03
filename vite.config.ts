import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'JSFramework',
      fileName: (format) => `js-framework.${format}.js`,
      formats: ['es', 'iife']
    },
    rollupOptions: {
      output: {
        globals: {},
        // Добавляем комментарий с информацией о фреймворке
        banner: '/* JS Framework v1.0.0 - Реактивный фреймворк для рендеринга HTML */\n',
        exports: 'named'
      }
    },
    minify: 'terser',
    sourcemap: true,
    target: 'es2020',
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  esbuild: {
    target: 'es2020'
  }
});