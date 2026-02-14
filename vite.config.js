import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: path.resolve(__dirname, 'js/text-pressure-entry.jsx'),
      output: {
        dir: path.resolve(__dirname, 'dist'),
        entryFileNames: 'text-pressure-bundle.js',
        format: 'iife',
        name: 'TextPressureApp'
      }
    }
  }
})
