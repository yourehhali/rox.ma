// Public + admin site-content hooks. Data flows from the backend via TanStack
// Query. SSR route loaders preseed the aggregate so `/`, `/services`, etc.
// render real content on the first paint.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EMPTY_SITE_CONTENT } from "@/lib/content-store";
import type { FaqItemData } from "@/lib/faq-data";
import type {
  Plan,
  PlanInput,
  Service,
  ServiceInput,
  SiteContent,
  SiteInfo,
} from "@/lib/api/types";
import * as content from "@/services/content";
import { keys } from "./queries/keys";
import { contentQueries } from "./queries/content";

export function useSiteContent(): SiteContent {
  const { data } = useQuery(contentQueries.aggregateOptions(false));
  return data ?? EMPTY_SITE_CONTENT;
}

// Read/write for the admin dashboard. Every action is a mutation that
// invalidates the content cache tree on success so all consumers refetch.
export function useSiteContentAdmin() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(contentQueries.aggregateOptions(true));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: keys.content.all });

  const saveService = useMutation({
    mutationFn: (service: Service) => {
      const input: ServiceInput = {
        slug: service.slug,
        name: service.name,
        tag: service.tag,
        icon: service.icon,
        short: service.short,
        faqKey: service.faqKey,
        published: service.published,
        page: service.page,
      };
      // Editors carry a local `svc_<base36>` placeholder id — POST a fresh
      // record whenever we still have one, otherwise PATCH the existing row.
      return service.id.startsWith("svc_")
        ? content.createService(input)
        : content.patchService(service.id, input);
    },
    onSuccess: invalidate,
  });

  const removeService = useMutation({
    mutationFn: (id: string) => content.deleteService(id),
    onSuccess: invalidate,
  });

  const savePlan = useMutation({
    mutationFn: (plan: Plan) => {
      const input: PlanInput = {
        name: plan.name,
        price: plan.price,
        unit: plan.unit,
        description: plan.description,
        features: plan.features,
        highlight: plan.highlight,
      };
      return plan.id.startsWith("plan_")
        ? content.createPlan(input)
        : content.updatePlan(plan.id, input);
    },
    onSuccess: invalidate,
  });

  const removePlan = useMutation({
    mutationFn: (id: string) => content.deletePlan(id),
    onSuccess: invalidate,
  });

  const setFaqs = useMutation({
    mutationFn: ({ group, items }: { group: string; items: FaqItemData[] }) =>
      content.replaceFaq(group, items),
    onSuccess: invalidate,
  });

  const setInfo = useMutation({
    mutationFn: (patch: Partial<SiteInfo>) => {
      const current =
        queryClient.getQueryData<SiteContent>(keys.content.aggregate(true)) ??
        queryClient.getQueryData<SiteContent>(keys.content.aggregate(false)) ??
        EMPTY_SITE_CONTENT;
      const next: SiteInfo = { ...current.info, ...patch };
      return content.putInfo(next);
    },
    onSuccess: invalidate,
  });

  const actions = {
    saveService: (service: Service) => saveService.mutateAsync(service),
    removeService: (id: string) => removeService.mutateAsync(id),
    savePlan: (plan: Plan) => savePlan.mutateAsync(plan),
    removePlan: (id: string) => removePlan.mutateAsync(id),
    setFaqs: (group: string, items: FaqItemData[]) => setFaqs.mutateAsync({ group, items }),
    setInfo: (patch: Partial<SiteInfo>) => setInfo.mutateAsync(patch),
  };

  return {
    content: data ?? EMPTY_SITE_CONTENT,
    ready: !isPending,
    actions,
  };
}
