import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

// Get backend URL from environment variable
const apiUrl = process.env.VITE_API_URL || 'http://localhost:8001';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Proxy API requests to backend
    // Note: For socket.io to work, the frontend must be on the same origin as the backend
    // In development, you may need to use a reverse proxy (nginx) or serve frontend from backend
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split country-state-city into its own chunk (it's huge - 8MB+)
          if (id.includes('country-state-city')) {
            return 'country-state-city';
          }

          // Split vendor libraries into separate chunks
          if (id.includes('node_modules')) {
            // Redux and related
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'redux-vendor';
            }

            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'radix-ui-vendor';
            }

            // TipTap editor
            if (id.includes('@tiptap')) {
              return 'tiptap-vendor';
            }

            // TanStack (React Table, Virtual)
            if (id.includes('@tanstack')) {
              return 'tanstack-vendor';
            }

            // Google Maps
            if (id.includes('@react-google-maps')) {
              return 'google-maps-vendor';
            }

            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }

            // Date libraries
            if (
              id.includes('date-fns') ||
              id.includes('moment') ||
              id.includes('react-day-picker')
            ) {
              return 'date-vendor';
            }

            // DnD Kit
            if (id.includes('@dnd-kit')) {
              return 'dnd-vendor';
            }

            // Socket.io
            if (id.includes('socket.io')) {
              return 'socket-vendor';
            }

            // Other large vendor libraries
            if (id.includes('react-icons') || id.includes('tippy.js') || id.includes('sonner')) {
              return 'ui-vendor';
            }
          }
        },
      },
    },
  },
});
