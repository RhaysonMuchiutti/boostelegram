import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer",
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: "util",
      crypto: "crypto-browserify",
    },
  },
  define: {
    // Importante: 'global' deve ser definido como um objeto vazio ou window, 
    // mas muitas libs esperam que ele exista para evitar crash imediato
    global: "window",
  },
  optimizeDeps: {
    // Garante que o Vite não tente otimizar de forma errada essas libs de node
    include: ["buffer", "process", "stream-browserify", "browserify-zlib", "util", "crypto-browserify"],
  },
}));
