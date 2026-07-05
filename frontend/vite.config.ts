import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Every /api/* request is proxied to the backend -> no need to worry about CORS
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
