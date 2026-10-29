-- ============================================================================
-- V8 — WhatsApp OTP client auth
--
-- Clients now authenticate with a WhatsApp number + OTP only (no email, no
-- password). `client_account.email` and `password_hash` become nullable so a
-- phone-only account can exist. A dedicated `phone_verification` table backs
-- the login OTP (mirrors email_verification) and an index speeds up phone
-- lookups + unclaimed-lead claim by phone.
-- ============================================================================

-- WhatsApp-only accounts have neither an email nor a password.
ALTER TABLE client_account ALTER COLUMN email DROP NOT NULL;
ALTER TABLE client_account ALTER COLUMN password_hash DROP NOT NULL;

-- Phone is now the client login key. Non-unique to tolerate legacy duplicates.
CREATE INDEX idx_client_phone ON client_account(phone) WHERE phone IS NOT NULL;

-- Single-use OTP rows keyed by normalized phone (purpose = login).
CREATE TABLE phone_verification (
  id          TEXT PRIMARY KEY,
  phone       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  purpose     TEXT NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ
);
CREATE INDEX idx_phone_verification_phone ON phone_verification(phone, purpose);

-- Fast lookup of unclaimed leads by phone at OTP verify.
CREATE INDEX idx_orders_unclaimed_phone
  ON orders(client_phone)
  WHERE client_id IS NULL;
