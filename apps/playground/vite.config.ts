import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
  optimizeDeps: {
    include: [
      "@zod-to-form/core",
      "@zod-to-form/react",
      "zod",
      "react-hook-form",
      "@hookform/resolvers/zod",
    ],
  },
  worker: {
    format: "es",
  },
  build: {
    target: "es2022",
  },
});
