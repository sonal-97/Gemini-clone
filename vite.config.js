import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",  // 👈 Important for Vercel!
  plugins: [react()],
  build: {
    outDir: "dist",  // 👈 Ensures correct output folder
  },
})