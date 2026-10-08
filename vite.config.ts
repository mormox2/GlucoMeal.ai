import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Identifiant de build : versionne le cache du service worker à chaque déploiement
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || Date.now().toString(36);

export default defineConfig(() => {
  return {
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    server: {
      // DISABLE_HMR=true désactive le rechargement à chaud et la surveillance des fichiers
      // (utile dans les environnements d'édition automatisée comme Google AI Studio)
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
