// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { remoteApiBase } from "./src/lib/remote-api";

const env = loadEnv("development", process.cwd(), "VITE_");
const remoteApi = remoteApiBase(env["VITE_REMOTE_API_BASE_URL"]);
const remoteOrigin = new URL(remoteApi).origin;

const apiProxy = {
  "/api/health": {
    target: remoteOrigin,
    changeOrigin: true,
    rewrite: () => "/health",
  },
  "/api": {
    target: remoteApi,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, ""),
  },
  "/health": {
    target: remoteOrigin,
    changeOrigin: true,
  },
};

export default defineConfig({
  vite: {
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      proxy: apiProxy,
    },
  },
  nitro: {
    output: {
      dir: "dist",
      publicDir: "dist",
      serverDir: "dist/server",
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Write static HTML into dist/client at build time (index.html for "/").
    prerender: {
      enabled: true,
      autoStaticPathsDiscovery: true,
      crawlLinks: true,
    },
    pages: [{ path: "/" }],
  },
});
