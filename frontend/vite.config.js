import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Demo build only: hosted demo pages can't load image files, so the logos are
// inlined as data URIs and everything is bundled into one HTML file.
const inlineLogos = () => {
  const dataUri = (file) =>
    `data:image/png;base64,${fs.readFileSync(path.resolve(import.meta.dirname, "public", file)).toString("base64")}`;
  const swap = (code) => code.replace(/"\/(srm-logo-[\w-]+\.png)"/g, (_, file) => JSON.stringify(dataUri(file)));
  return {
    name: "inline-logos",
    transform: (code, id) => (id.includes("/src/") ? swap(code) : null),
    transformIndexHtml: (html) => swap(html),
  };
};

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === "demo" ? [inlineLogos(), viteSingleFile()] : [])],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: mode === "demo" ? { outDir: "dist-demo", copyPublicDir: false } : {},
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
}));
