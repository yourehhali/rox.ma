// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { ConfigEnv, PluginOption, UserConfig } from "vite";

// Build-time speed: the Lovable wrapper hard-codes the `vite-tsconfig-paths`
// plugin, which its own [PLUGIN_TIMINGS] output reports as consuming 35–85% of
// every Vite build (a ~15-minute SSR pass on our deploy VPS). It is fully
// redundant here: the project's only tsconfig mapping (`@/* -> ./src/*`) is
// already served by the wrapper's own `resolve.alias`, and Vite 8 resolves
// tsconfig paths natively via `resolve.tsconfigPaths` (enabled below). The
// wrapper exposes no opt-out flag, and Vite 8 snapshots the plugin list before
// running plugin `config` hooks — so removal is only effective if it happens on
// the returned config object, before Vite ever sees it.
const lovableConfig = defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // The wrapper's default import-protection rules flag client imports of
    // `**/server/**` files or the `server-only` specifier — neither exists in
    // this codebase (no server directories, no server-only imports), yet the
    // plugin scans every module of every environment and accounts for ~60% of
    // the SSR build. Disabled accordingly.
    importProtection: { enabled: false },
  },
  // Pin Nitro to a portable Node-server build so the Docker image can run
  // `.output/server/index.mjs` under `node` without any Cloudflare-specific
  // wrangler/npm work. Vite's build normally emits to `.output/`.
  nitro: { preset: "node-server" },
  // Native Vite 8 replacement for the removed vite-tsconfig-paths plugin.
  vite: {
    resolve: { tsconfigPaths: true },
  },
});

export default async (env: ConfigEnv): Promise<UserConfig> => {
  const config = await lovableConfig(env);
  if (Array.isArray(config.plugins)) {
    // Await + flatten, then drop only the redundant plugin instance.
    const flat = (await Promise.all(config.plugins as PluginOption[])).flat(Infinity) as PluginOption[];
    config.plugins = flat.filter(
      (p) => !(p && typeof p === "object" && "name" in p && p.name === "vite-tsconfig-paths"),
    ) as NonNullable<UserConfig["plugins"]>;
  }
  return config;
};
