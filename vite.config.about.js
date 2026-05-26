import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// About page — FluidGlass React island bundle.
// Mirrors vite.config.scroll-reveal.js. emptyOutDir:false preserves the other bundles.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Same gsap shim as the scroll-reveal bundle, in case any dep ever resolves gsap.
      'gsap/ScrollTrigger': path.resolve(__dirname, 'js/gsap-scrolltrigger-shim.js'),
      'gsap': path.resolve(__dirname, 'js/gsap-shim.js'),
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // CRITICAL: preserve other Vite build outputs
    assetsInlineLimit: 0, // never inline the .glb
    rollupOptions: {
      input: path.resolve(__dirname, 'js/about-hero-entry.jsx'),
      output: {
        dir: path.resolve(__dirname, 'dist'),
        entryFileNames: 'about-hero-bundle.js',
        format: 'iife',
        name: 'AboutHeroApp',
        inlineDynamicImports: true, // Single-file bundle — no async chunk waterfall
      }
    }
  }
})
