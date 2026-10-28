-- ============================================================================
-- V7 — Floating WhatsApp button configuration
--
-- The public site gains a floating WhatsApp bubble that the admin controls from
-- Content → Coordonnées. The number itself already lives in `whatsapp`; these
-- columns drive visibility, the pre-filled opening message and the corner the
-- bubble sits in. Existing rows default to disabled so nothing appears until it
-- is explicitly configured.
-- ============================================================================

ALTER TABLE site_info
  ADD COLUMN whatsapp_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN whatsapp_message  TEXT    NOT NULL DEFAULT '',
  ADD COLUMN whatsapp_position TEXT    NOT NULL DEFAULT 'right';
