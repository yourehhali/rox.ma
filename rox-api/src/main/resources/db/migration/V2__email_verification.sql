-- ============================================================================
-- V2 — Email verification + phone field on client_account
-- Adds columns required by Phase 1 (phone) and Phase 3 (email OTP flow).
-- Existing rows keep verified=FALSE and are covered by a 24 h grace period
-- enforced in AuthService when ROX_VERIFICATION_REQUIRED flips to true.
-- ============================================================================

ALTER TABLE client_account ADD COLUMN phone TEXT;
ALTER TABLE client_account ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE client_account ADD COLUMN verified_at TIMESTAMPTZ;

CREATE TABLE email_verification (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  purpose     TEXT NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ
);
CREATE INDEX idx_email_verification_email ON email_verification(email, purpose);
