// Portfolio gallery. Public page + admin dashboard.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PortfolioItem, PortfolioItemInput } from "@/lib/api/types";
import * as portfolio from "@/services/portfolio";
import { keys } from "./queries/keys";

function toInput(item: PortfolioItem): PortfolioItemInput {
  return {
    title: item.title,
    client: item.client,
    sector: item.sector,
    service: item.service,
    city: item.city,
    summary: item.summary,
    result: item.result,
    tags: item.tags,
    colorA: item.colorA,
    colorB: item.colorB,
    featured: item.featured,
    published: item.published,
  };
}

export function usePortfolio() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: keys.portfolio.list(true),
    queryFn: () => portfolio.listPortfolio(true),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: keys.portfolio.all });

  const create = useMutation({
    mutationFn: (item: PortfolioItem) => portfolio.createPortfolioItem(toInput(item)),
    onSuccess: invalidate,
  });
  const patch = useMutation({
    mutationFn: (item: PortfolioItem) => portfolio.patchPortfolioItem(item.id, toInput(item)),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => portfolio.deletePortfolioItem(id),
    onSuccess: invalidate,
  });
  const togglePublished = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      portfolio.setPublished(id, published),
    onSuccess: invalidate,
  });
  const toggleFeatured = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      portfolio.setFeatured(id, featured),
    onSuccess: invalidate,
  });

  const items = data ?? [];
  const actions = {
    save: (item: PortfolioItem) =>
      // Editors start from `emptyDraft()` which has a local UUID not present on
      // the server. Detect a "never created" row by looking at whether it
      // appears in the current admin list.
      items.some((i) => i.id === item.id) ? patch.mutateAsync(item) : create.mutateAsync(item),
    remove: (id: string) => remove.mutateAsync(id),
    togglePublished: (id: string) => {
      const current = items.find((i) => i.id === id);
      return togglePublished.mutateAsync({ id, published: !(current?.published ?? false) });
    },
    toggleFeatured: (id: string) => {
      const current = items.find((i) => i.id === id);
      return toggleFeatured.mutateAsync({ id, featured: !(current?.featured ?? false) });
    },
  };

  return { items, ready: !isPending, actions };
}

// Read-only, for the public gallery (published items only).
export function usePortfolioItems() {
  const { data, isPending } = useQuery({
    queryKey: keys.portfolio.list(false),
    queryFn: () => portfolio.listPortfolio(false),
    staleTime: 60_000,
  });
  return { items: data ?? [], ready: !isPending };
}
