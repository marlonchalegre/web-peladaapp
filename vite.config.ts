import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifestFilename: "manifest.json",
      injectRegister: "inline",
      devOptions: {
        enabled: true,
      },
      includeAssets: [
        "logo.png",
        "vite.svg",
        "apple-icon-180.png",
        "manifest-icon-192.maskable.png",
        "manifest-icon-512.maskable.png",
      ],
      manifest: {
        name: "Pelada App",
        short_name: "Pelada",
        description: "Organize suas peladas de forma eficiente",
        theme_color: "#1976d2",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        id: "/",
        lang: "pt-BR",
        categories: ["sports", "productivity"],
        shortcuts: [
          {
            name: "Início",
            short_name: "Início",
            description: "Ir para a página inicial",
            url: "/",
            icons: [
              { src: "/manifest-icon-192.maskable.png", sizes: "192x192" },
            ],
          },
          {
            name: "Meu Perfil",
            short_name: "Perfil",
            description: "Ver meu perfil",
            url: "/profile",
            icons: [
              { src: "/manifest-icon-192.maskable.png", sizes: "192x192" },
            ],
          },
        ],
        icons: [
          {
            src: "/manifest-icon-192.maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/manifest-icon-512.maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/manifest-icon-192.maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/manifest-icon-512.maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/apple-splash-1125-2436.png",
            sizes: "1125x2436",
            type: "image/png",
            form_factor: "narrow",
            label: "Página Inicial do Pelada App no Celular",
          },
          {
            src: "/apple-splash-2436-1125.png",
            sizes: "2436x1125",
            type: "image/png",
            form_factor: "wide",
            label: "Página Inicial do Pelada App no Tablet",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 8080,
    // Allow overriding backend URL; defaults to localhost for non-Docker dev
    // In Docker, we pass VITE_BACKEND_URL=http://backend:8000 via compose
    watch: {
      usePolling: true,
      interval: 300,
    },
    hmr: {
      clientPort: 8080,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      "/auth": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "axios",
            "i18next",
          ],
          mui: [
            "@mui/material",
            "@mui/icons-material",
            "@emotion/react",
            "@emotion/styled",
          ],
        },
      },
    },
  },
});
