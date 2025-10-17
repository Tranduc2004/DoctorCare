import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === "serve";
  return {
    plugins: [react(), tailwindcss()],
    server: isDev
      ? {
          proxy: {
            // Proxy all /api requests to backend during development
            "/api": {
              target: "http://localhost:5000",
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  };
});
