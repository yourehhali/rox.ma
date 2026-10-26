import { createContext, useContext } from "react";
import type {
  CallBooking,
  ChangeRequest,
  NewOrderInput,
  Order,
  PortalData,
} from "@/lib/client-store";

export type ClientContextValue = {
  data: PortalData;
  /** True while the initial portal query is still running. */
  loading: boolean;
  createOrder: (input: NewOrderInput) => void;
  toggleTask: (orderId: string, taskId: string) => void;
  requestChange: (orderId: string, type: ChangeRequest["type"], note: string) => void;
  sendMessage: (text: string) => void;
  bookCall: (booking: Omit<CallBooking, "id" | "status">) => void;
};

export const ClientContext = createContext<ClientContextValue | null>(null);

export function useClient(): ClientContextValue {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClient must be used within a ClientProvider");
  return ctx;
}

// Re-exported so consumers have these types without importing the store directly.
export type { Order, NewOrderInput };
