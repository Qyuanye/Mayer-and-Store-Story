import { defineConfig } from 'vite';
import path from 'path';
export default defineConfig({
  server:{
    port:3000,
    open:true,
  },
  base: './',
  root: './',
  build: {
    outDir: './dist',
    assetsInlineLimit: 1000000, 
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), 
      },
       output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
        entryFileNames: "game.js",
        chunkFileNames: "game.js",
        assetFileNames: "game.[ext]"
      }
    },
    minify:"terser"
  },
   plugins: [],
});