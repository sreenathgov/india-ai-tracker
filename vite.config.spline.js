import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // CRITICAL: preserve first Vite build output
    rollupOptions: {
      input: path.resolve(__dirname, 'js/spline-globe-entry.jsx'),
      output: {
        dir: path.resolve(__dirname, 'dist'),
        entryFileNames: 'spline-globe-bundle.js',
        format: 'iife',
        name: 'SplineGlobeApp',
        inlineDynamicImports: true // Force single file — no async chunk waterfall
      }
    }
  }
})
