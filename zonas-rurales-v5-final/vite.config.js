import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// No proxy needed - app is 100% offline
export default defineConfig({
   base: "/zonas-rurales-v5-finall/",
  plugins: [svelte()],
})
