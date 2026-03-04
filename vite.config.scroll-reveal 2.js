import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Shim gsap imports to CDN window globals — single instance, no bundling
      'gsap/ScrollTrigger': path.resolve(__dirname, 'js/gsap-scrolltrigger-shim.js'),
      'gsap': path.resolve(__dirname, 'js/gsap-shim.js'),
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // CRITICAL: preserve other Vite build outputs
    rollupOptions: {
      input: path.resolve(__dirname, 'js/scroll-reveal-entry.jsx'),
      output: {
        dir: path.resolve(__dirname, 'dist'),
        entryFileNames: 'scroll-reveal-bundle.js',
        format: 'iife',
        name: 'ScrollRevealApp',
        inlineDynamicImports: true, // Force single file — no async chunk waterfall
      }
    }
  }
})
