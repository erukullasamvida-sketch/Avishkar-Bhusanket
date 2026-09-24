// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:

// - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//   nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//   React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      allowedHosts: ["unguided-enlighten-pawing.ngrok-free.dev"],
    },
  },

  tanstackStart: {
    server: { entry: "server" },
  },
});
