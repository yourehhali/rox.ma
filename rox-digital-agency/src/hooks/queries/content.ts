// Query options factories for the site-content domain. Used by both SSR
// loaders (`queryClient.ensureQueryData(contentQueries.aggregateOptions())`)
// and hooks.

import { queryOptions } from "@tanstack/react-query";
import * as content from "@/services/content";
import { keys } from "./keys";

export const contentQueries = {
  aggregateOptions: (all = false) =>
    queryOptions({
      queryKey: keys.content.aggregate(all),
      queryFn: () => content.getAggregate(all),
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60,
    }),
  serviceBySlugOptions: (slug: string) =>
    queryOptions({
      queryKey: keys.content.serviceBySlug(slug),
      queryFn: () => content.getServiceBySlug(slug),
      staleTime: Infinity,
    }),
};
