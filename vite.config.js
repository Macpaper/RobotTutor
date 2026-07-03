import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    root: 'client',
    build: {
        outDir: '../public/build',
        emptyOutDir: true,
        rollupOptions: {
            input: 'client/src/main.jsx',
            output: {
                entryFileNames: 'main.js',
                assetFileNames: 'main.[ext]',
            },
        },
    },
});