import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";
import { apiErrorMessage } from "./lib/api/error-message";

export const getRouter = () => {
  const queryClient = new QueryClient({
    // SSR loaders fill this cache and the ssr-query integration below transfers
    // its state to the browser, so hydrated components render with real data
    // on the very first client pass (no #418 mismatch against server HTML).
    // 30s freshness keeps mount-time background refetches from doubling reads.
    defaultOptions: { queries: { staleTime: 30_000 } },
    // Single safety net: every failed mutation raises a toast unless it opts
    // out via `meta: { silentError: true }` (panels with their own inline
    // error banners). Without this, rejected orders/messages/bookings died
    // silently and users believed the action had succeeded.
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const meta = (mutation.options as { meta?: { silentError?: boolean } }).meta;
        if (meta?.silentError) return;
        toast.error("Action échouée", { description: apiErrorMessage(error) });
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Dehydrate server cache → HTML → hydrate browser cache. __root.tsx already
  // owns the QueryClientProvider, hence wrapQueryClient: false.
  setupRouterSsrQueryIntegration({ router, queryClient, wrapQueryClient: false });

  return router;
};
