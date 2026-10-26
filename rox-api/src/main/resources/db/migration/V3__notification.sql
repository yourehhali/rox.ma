-- ============================================================================
-- V3 — Notification table (Phase 4)
-- Rows are inserted by the NotificationListener in response to domain events
-- and pushed to clients over STOMP. Read-state lives in `read_at`.
-- ============================================================================

CREATE TABLE notification (
  id             TEXT PRIMARY KEY,
  recipient_role TEXT NOT NULL,
  recipient_id   TEXT NOT NULL,
  kind           TEXT NOT NULL,
  order_id       TEXT,
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_recipient
  ON notification(recipient_role, recipient_id, read_at);
CREATE INDEX idx_notification_created
  ON notification(recipient_role, recipient_id, created_at DESC);
