import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [react(), dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        tauri: 'src/tauri.ts',
        web: 'src/web.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^@tauri-apps\//, 'react', 'react/jsx-runtime'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
