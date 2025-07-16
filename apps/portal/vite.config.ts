import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from "vite-plugin-pwa"
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  VitePWA({
    devOptions: {
      enabled: true
    },
    strategies: "injectManifest",
    srcDir: "src",
    filename: "sw.ts",
    registerType: "autoUpdate",
    injectManifest: {
      swDest: "dist/sw.js"
    },
    manifest: {
      name: "App Name",
      short_name: "App",
      icons: [
        {
          "src": "manifest-icon-192.maskable.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "manifest-icon-192.maskable.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "maskable"
        },
        {
          "src": "manifest-icon-512.maskable.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "manifest-icon-512.maskable.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "maskable"
        }
      ],
      theme_color: "#fff",
      background_color: "#fff",
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
    }
  })
  ],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }]
  },
})
