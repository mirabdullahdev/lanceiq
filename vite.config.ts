import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom domain on GitHub Pages serves from the root, so `base` stays '/'.
// If you ever fall back to <user>.github.io/lanceiq/, change this to '/lanceiq/'.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    cssTarget: 'chrome100',
    /*
     * Do NOT hand-roll a `three` chunk here.
     *
     * Forcing three.js into its own named chunk makes the bundler treat it as
     * a shared chunk, and Vite then hoists a <link rel="modulepreload"> for it
     * into index.html. That preload is high priority and unconditional, so
     * every visitor — including phones, which never mount the canvas — eagerly
     * downloaded ~890kb of three.js in competition with the critical path.
     *
     * Left alone, three.js lands inside the dynamically imported HeroField
     * chunk and is fetched only when that import actually fires.
     */
  },
})
