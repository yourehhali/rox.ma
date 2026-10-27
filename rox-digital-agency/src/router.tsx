import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { routeTree } from "./routeTree.gen";
import { apiErrorMessage } from "./lib/api/error-message";

export const getRouter = () => {
  const queryClient = new QueryClient({
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

  return router;
};
