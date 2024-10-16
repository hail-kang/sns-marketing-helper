import { defineConfig } from "vite"
import path from "path"

export default defineConfig({
  build: {
    lib: {
      entry: {
        content: "src/content.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].mjs",
        chunkFileNames: "[name]-[hash].mjs",
        assetFileNames: "[name]-[hash][extname]",
      },
    },
    emptyOutDir: false,
    minify: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@@": path.resolve(__dirname, "./node_modules"),
    },
  },
})
