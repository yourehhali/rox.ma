-- ============================================================================
-- V4 — Order stage + stage_history (Phase 6 kanban)
-- Adds a `stage` column on `orders` (LEAD / ONBOARDING / PRODUCTION / REVIEW /
-- DELIVERED / ARCHIVED) and a lightweight audit trail on transitions.
-- Existing rows are backfilled from the legacy `status` + `phase` values.
-- ============================================================================

ALTER TABLE orders ADD COLUMN stage TEXT NOT NULL DEFAULT 'LEAD';
CREATE INDEX idx_orders_stage ON orders(stage, created_at DESC);

UPDATE orders SET stage = CASE status
  WHEN 'draft'      THEN 'LEAD'
  WHEN 'submitted'  THEN 'ONBOARDING'
  WHEN 'in_progress' THEN 'PRODUCTION'
  WHEN 'review'     THEN 'REVIEW'
  WHEN 'delivered'  THEN 'DELIVERED'
  ELSE 'LEAD'
END;

CREATE TABLE stage_history (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage   TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stage_history_order ON stage_history(order_id, changed_at DESC);
