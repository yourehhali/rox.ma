-- ============================================================================
-- V9 — WhatsApp admin activity notifications
-- Push a WhatsApp message to the agency's own number on every site event
-- (new order/lead, new client signup, client message, call booking, change
-- request). Reuses the OpenWA gateway configured in V5; only the recipient
-- and the on/off switch are new. Disabled by default; the admin panel or
-- ROX_ADMIN_WHATSAPP(_NOTIFY) env vars drive it.
-- ============================================================================

ALTER TABLE whatsapp_settings
  ADD COLUMN notify_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN notify_phone   TEXT;
