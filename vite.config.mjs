import { fileURLToPath, URL } from "url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue2";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    base: "./",
    // Component asset URLs point into public/ and must stay relative at runtime.
    plugins: [vue({ template: { transformAssetUrls: false } })],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      },
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"]
    },
    server: {
      port: 8080,
      watch: {
        ignored: ["**/.tmp/**"]
      }
    },
    build: {
      outDir: env.VITE_STEAM === "true" ? "../AppFiles" : "dist",
      sourcemap: true
    }
  };
});
