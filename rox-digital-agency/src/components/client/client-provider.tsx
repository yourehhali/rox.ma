// Client portal provider — reads the current authenticated user from the
// `rox-token:client` slot and hydrates the portal from `GET /portal`. The
// `clientId` prop is retained for backward compatibility but is otherwise
// unused: the server derives the client from the bearer token.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, type ReactNode } from "react";
import { ClientContext } from "@/components/client/client-context";
import { EMPTY_PORTAL } from "@/lib/client-store";
import type { PortalData } from "@/lib/api/types";
import * as bookingsSvc from "@/services/bookings";
import * as messagesSvc from "@/services/messages";
import * as ordersSvc from "@/services/orders";
import * as portalSvc from "@/services/portal";
import { keys } from "@/hooks/queries/keys";

export function ClientProvider({
  clientId: _clientId,
  children,
}: {
  clientId?: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: keys.portal.me(),
    queryFn: portalSvc.getPortal,
  });
  const value: PortalData = data ?? EMPTY_PORTAL;

  const invalidatePortal = () => queryClient.invalidateQueries({ queryKey: keys.portal.all });

  const createOrderMut = useMutation({
    mutationFn: ordersSvc.createOrder,
    onSuccess: invalidatePortal,
  });
  const taskMut = useMutation({
    mutationFn: ({ orderId, taskId }: { orderId: string; taskId: string }) =>
      ordersSvc.toggleTask(orderId, taskId),
    onSuccess: invalidatePortal,
  });
  const requestMut = useMutation({
    mutationFn: ({
      orderId,
      type,
      note,
    }: {
      orderId: string;
      type: "update" | "edit";
      note: string;
    }) => ordersSvc.addRequest(orderId, { type, note }),
    onSuccess: invalidatePortal,
  });
  const sendMut = useMutation({
    mutationFn: (text: string) => messagesSvc.sendMessage({ text }),
    onSuccess: invalidatePortal,
  });
  const bookMut = useMutation({
    mutationFn: bookingsSvc.book,
    onSuccess: invalidatePortal,
  });

  const createOrder = useCallback(
    (input: Parameters<typeof ordersSvc.createOrder>[0]) => {
      createOrderMut.mutate(input);
    },
    [createOrderMut],
  );

  const toggleTask = useCallback(
    (orderId: string, taskId: string) => taskMut.mutate({ orderId, taskId }),
    [taskMut],
  );
  const requestChange = useCallback(
    (orderId: string, type: "update" | "edit", note: string) =>
      requestMut.mutate({ orderId, type, note }),
    [requestMut],
  );
  const sendMessage = useCallback((text: string) => sendMut.mutate(text), [sendMut]);
  const bookCall = useCallback(
    (booking: Omit<Parameters<typeof bookingsSvc.book>[0], never>) => bookMut.mutate(booking),
    [bookMut],
  );

  const valueMemo = useMemo(
    () => ({
      data: value,
      loading: isPending,
      createOrder,
      toggleTask,
      requestChange,
      sendMessage,
      bookCall,
    }),
    [value, isPending, createOrder, toggleTask, requestChange, sendMessage, bookCall],
  );

  return <ClientContext.Provider value={valueMemo}>{children}</ClientContext.Provider>;
}
