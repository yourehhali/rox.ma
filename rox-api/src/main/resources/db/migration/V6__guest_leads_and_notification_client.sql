-- ============================================================================
-- V6 — Guest order leads + notification client scoping
--
-- Orders can now be created by unauthenticated visitors (a public wizard):
-- `client_id` becomes nullable and the lead's contact details are captured on
-- the order itself so signup/login can claim it by email. Notifications gain a
-- `client_id` so the admin can mark a specific client's message notifications
-- read (unread-badge sync).
-- ============================================================================

ALTER TABLE orders ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE orders
  ADD COLUMN client_email TEXT,
  ADD COLUMN client_name  TEXT,
  ADD COLUMN client_phone TEXT;

-- Fast lookup of unclaimed leads by email at signup/login.
CREATE INDEX idx_orders_unclaimed_email
  ON orders(client_email)
  WHERE client_id IS NULL;

-- Per-client read scoping for message notifications.
ALTER TABLE notification ADD COLUMN client_id TEXT;
CREATE INDEX idx_notification_client
  ON notification(recipient_role, recipient_id, client_id, read_at);
