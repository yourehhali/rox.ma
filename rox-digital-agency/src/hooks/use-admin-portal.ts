// Admin dashboard aggregate. Composes clients list + per-client portal
// snapshots + admin-scoped orders + stats + traffic. All mutations invalidate
// the affected cache keys so the UI reflects the new state without a reload.

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { EMPTY_PORTAL } from "@/lib/client-store";
import type {
  AdminBooking,
  AdminOrder,
  AdminStats,
  CallBooking,
  ChangeRequest,
  ClientRef,
  ClientUser,
  Order,
  OrderStatus,
  PortalData,
  TrafficPoint,
  TrafficRange,
} from "@/lib/api/types";
import * as bookingsSvc from "@/services/bookings";
import * as clientsSvc from "@/services/clients";
import * as messagesSvc from "@/services/messages";
import * as ordersSvc from "@/services/orders";
import * as analyticsSvc from "@/services/analytics";
import { keys } from "./queries/keys";

export type ClientSnapshot = { user: ClientUser; data: PortalData };
export type OpenRequest = { client: ClientRef; order: Order; request: ChangeRequest };
export type PendingBooking = { client: ClientRef; booking: CallBooking };

export function useAdminPortal(range: TrafficRange = "12M") {
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: keys.clients.list(),
    queryFn: clientsSvc.listClients,
  });

  const portalQueries = useQueries({
    queries: (clientsQuery.data ?? []).map((user) => ({
      queryKey: keys.clients.portalOf(user.id),
      queryFn: () => clientsSvc.getClientPortal(user.id),
    })),
  });

  const ordersQuery = useQuery({
    queryKey: keys.orders.list("admin"),
    queryFn: async () => (await ordersSvc.listOrders("admin")) as AdminOrder[],
  });

  const bookingsQuery = useQuery({
    queryKey: keys.bookings.list("admin"),
    queryFn: async () => (await bookingsSvc.listBookings("admin")) as AdminBooking[],
  });

  const statsQuery = useQuery({
    queryKey: keys.admin.stats(),
    queryFn: analyticsSvc.getAdminStats,
  });

  const trafficQuery = useQuery({
    queryKey: keys.admin.traffic(range),
    queryFn: () => analyticsSvc.getTraffic(range),
  });

  const snapshots = useMemo<ClientSnapshot[]>(
    () =>
      (clientsQuery.data ?? []).map((user, i) => ({
        user,
        data: (portalQueries[i]?.data ?? EMPTY_PORTAL) as PortalData,
      })),
    [clientsQuery.data, portalQueries],
  );

  const allOrders = useMemo<AdminOrder[]>(() => ordersQuery.data ?? [], [ordersQuery.data]);

  const openRequests = useMemo<OpenRequest[]>(
    () =>
      allOrders.flatMap(({ client, order }) =>
        order.requests
          .filter((r) => r.status === "ouvert")
          .map((request) => ({ client, order, request })),
      ),
    [allOrders],
  );

  const pendingBookings = useMemo<PendingBooking[]>(
    () =>
      (bookingsQuery.data ?? [])
        .filter(({ booking }) => booking.status === "demandé")
        .map(({ client, booking }) => ({ client, booking })),
    [bookingsQuery.data],
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: keys.clients.all });
    queryClient.invalidateQueries({ queryKey: keys.orders.all });
    queryClient.invalidateQueries({ queryKey: keys.messages.all });
    queryClient.invalidateQueries({ queryKey: keys.bookings.all });
    queryClient.invalidateQueries({ queryKey: keys.admin.all });
  };

  const statusMut = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      ordersSvc.patchStatus(orderId, status),
    onSuccess: invalidateAll,
  });
  const taskMut = useMutation({
    mutationFn: ({ orderId, taskId }: { orderId: string; taskId: string }) =>
      ordersSvc.toggleTask(orderId, taskId),
    onSuccess: invalidateAll,
  });
  const addTaskMut = useMutation({
    mutationFn: ({ orderId, label }: { orderId: string; label: string }) =>
      ordersSvc.addTask(orderId, label),
    onSuccess: invalidateAll,
  });
  const deleteTaskMut = useMutation({
    mutationFn: ({ orderId, taskId }: { orderId: string; taskId: string }) =>
      ordersSvc.deleteTask(orderId, taskId),
    onSuccess: invalidateAll,
  });
  const requestMut = useMutation({
    mutationFn: ({ orderId, requestId }: { orderId: string; requestId: string }) =>
      ordersSvc.handleRequest(orderId, requestId),
    onSuccess: invalidateAll,
  });
  const uiPromptMut = useMutation({
    mutationFn: (orderId: string) => ordersSvc.regenerateUiPrompt(orderId),
    onSuccess: invalidateAll,
  });
  const briefMut = useMutation({
    mutationFn: ({ orderId, description }: { orderId: string; description: string }) =>
      ordersSvc.updateOrderBrief(orderId, description),
    onSuccess: invalidateAll,
  });
  const replyMut = useMutation({
    mutationFn: ({ clientId, text }: { clientId: string; text: string }) =>
      messagesSvc.sendMessage({ text, clientId }, "admin"),
    onSuccess: invalidateAll,
    meta: { silentError: true },
  });
  const confirmMut = useMutation({
    mutationFn: (bookingId: string) => bookingsSvc.confirmBooking(bookingId),
    onSuccess: invalidateAll,
  });

  const actions = useMemo(
    () => ({
      // `clientId` is kept in the signature so existing component callers stay
      // unchanged; the server derives it from the order/booking anyway.
      toggleTask: (_clientId: string, orderId: string, taskId: string) =>
        taskMut.mutateAsync({ orderId, taskId }),
      addTask: (_clientId: string, orderId: string, label: string) =>
        addTaskMut.mutateAsync({ orderId, label }),
      deleteTask: (_clientId: string, orderId: string, taskId: string) =>
        deleteTaskMut.mutateAsync({ orderId, taskId }),
      setStatus: (_clientId: string, orderId: string, status: OrderStatus) =>
        statusMut.mutateAsync({ orderId, status }),
      handleRequest: (_clientId: string, orderId: string, requestId: string) =>
        requestMut.mutateAsync({ orderId, requestId }),
      regenerateUiPrompt: (orderId: string) => uiPromptMut.mutateAsync(orderId),
      updateBrief: (orderId: string, description: string) =>
        briefMut.mutateAsync({ orderId, description }),
      reply: (clientId: string, text: string) => replyMut.mutateAsync({ clientId, text }),
      confirmBooking: (_clientId: string, bookingId: string) => confirmMut.mutateAsync(bookingId),
    }),
    [
      taskMut,
      addTaskMut,
      deleteTaskMut,
      statusMut,
      requestMut,
      uiPromptMut,
      briefMut,
      replyMut,
      confirmMut,
    ],
  );

  const stats: AdminStats = statsQuery.data ?? {
    clients: 0,
    active: 0,
    completed: 0,
    openRequests: 0,
  };

  const traffic: TrafficPoint[] = trafficQuery.data ?? [];

  return {
    snapshots,
    allOrders,
    openRequests,
    pendingBookings,
    actions,
    stats,
    traffic,
    refresh: invalidateAll,
    ready: !clientsQuery.isPending && !ordersQuery.isPending,
  };
}

export type AdminPortal = ReturnType<typeof useAdminPortal>;
