-- ============================================================================
-- V5 — WhatsApp OTP settings (OpenWA gateway integration)
-- A single-row config table edited from the admin panel. Blank columns fall
-- back to env-derived defaults in WhatsAppSettingsService (rox.whatsapp.*).
-- The WhatsApp session itself lives in OpenWA; we only store its resolved
-- session_id here once pairing completes.
-- ============================================================================

CREATE TABLE whatsapp_settings (
  id               TEXT PRIMARY KEY,
  enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  base_url         TEXT,
  api_key          TEXT,
  session_name     TEXT,
  session_id       TEXT,
  message_template TEXT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the singleton row (disabled). Runtime edits UPDATE this row in place.
INSERT INTO whatsapp_settings (id, enabled) VALUES ('singleton', FALSE);
