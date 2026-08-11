import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
          three: ["three"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: false,
  },
});
