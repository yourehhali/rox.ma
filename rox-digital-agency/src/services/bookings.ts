// Call bookings: client requests, admin confirms.

import { apiFetch } from "@/lib/api/http";
import { mapAdminBooking, mapCallBooking } from "@/lib/api/mappers";
import type { Role } from "@/lib/api/token-store";
import type { AdminBooking, BookCallInput, CallBooking } from "@/lib/api/types";

type RawCallBooking = Parameters<typeof mapCallBooking>[0];
type RawAdminBooking = Parameters<typeof mapAdminBooking>[0];

export async function listBookings(role: Role): Promise<CallBooking[] | AdminBooking[]> {
  const raw = await apiFetch<unknown[]>("/bookings", { method: "GET" }, { role });
  if (role === "admin") return (raw as RawAdminBooking[]).map(mapAdminBooking);
  return (raw as RawCallBooking[]).map(mapCallBooking);
}

export async function book(input: BookCallInput): Promise<CallBooking> {
  const raw = await apiFetch<RawCallBooking>(
    "/bookings",
    { method: "POST", body: input },
    { role: "client" },
  );
  return mapCallBooking(raw);
}

export async function confirmBooking(bookingId: string): Promise<AdminBooking> {
  const raw = await apiFetch<RawAdminBooking>(
    `/bookings/${bookingId}/confirm`,
    { method: "POST" },
    { role: "admin" },
  );
  return mapAdminBooking(raw);
}
