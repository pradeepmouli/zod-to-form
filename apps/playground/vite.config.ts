import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";

function registryProxy(): Plugin {
  return {
    name: "registry-proxy",
    configureServer(server) {
      server.middlewares.use("/api/registry-proxy", (req, res) => {
        const url = new URL(req.url ?? "", "http://localhost");
        const target = url.searchParams.get("url");
        if (!target) {
          res.statusCode = 400;
          res.end("Missing url parameter");
          return;
        }

        const doRequest = target.startsWith("https://")
          ? httpsRequest
          : httpRequest;

        const proxyReq = doRequest(target, { timeout: 8000 }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, {
            "Content-Type":
              proxyRes.headers["content-type"] ?? "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          proxyRes.pipe(res);
        });

        proxyReq.on("error", () => {
          if (!res.headersSent) {
            res.statusCode = 502;
            res.end("Proxy error");
          }
        });

        proxyReq.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), registryProxy()],
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
