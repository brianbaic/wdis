import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.PORT || 4173);
  const token = env.TMDB_READ_ACCESS_TOKEN || "";

  return {
    plugins: [react()],
    cacheDir: ".vite-cache",
    server: {
      host: "0.0.0.0",
      port,
      proxy: {
        "/api/tmdb": {
          target: "https://api.themoviedb.org",
          changeOrigin: true,
          secure: true,
          rewrite: (pathname) => pathname.replace(/^\/api\/tmdb/, "/3"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (token) {
                proxyReq.setHeader("Authorization", `Bearer ${token}`);
              }

              proxyReq.setHeader("Accept", "application/json");
            });
          },
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port,
    },
  };
});
