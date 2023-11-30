import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: "es2022"
  },
  esbuild: {
    supported: {
      'top-level-await': true
    },
  },
  plugins: [],
});