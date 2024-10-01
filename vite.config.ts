import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
      },
    },
    emptyOutDir: true,
    cssCodeSplit: true,
    minify: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@@": path.resolve(__dirname, "./node_modules"),
    },
  },
})
