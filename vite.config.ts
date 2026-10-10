// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: {
      "/api/health": {
        target: "https://services.panenlink.id",
        changeOrigin: true,
        rewrite: () => "/health",
      },
      "/api": {
        target: "https://services.panenlink.id/api/v1",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api(?:\/v1)?/, ""),
      },
      "/health": {
        target: "https://services.panenlink.id",
        changeOrigin: true,
      },
    },
  },
  vite: {
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      proxy: {
        "/api/health": {
          target: "https://services.panenlink.id",
          changeOrigin: true,
          rewrite: () => "/health",
        },
        "/api": {
          target: "https://services.panenlink.id/api/v1",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api(?:\/v1)?/, ""),
        },
        "/health": {
          target: "https://services.panenlink.id",
          changeOrigin: true,
        },
      },
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
} as any);
