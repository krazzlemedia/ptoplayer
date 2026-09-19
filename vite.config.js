import { defineConfig } from "vite";

// Relative base so the player works at both
// username.github.io and username.github.io/repository-name/
export default defineConfig({
  base: "./",
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: false
  },
  preview: {
    port: 4173,
    strictPort: false
  }
});
