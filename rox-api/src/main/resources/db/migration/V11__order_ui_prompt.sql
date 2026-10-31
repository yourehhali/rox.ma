-- Per-order AI triage: a Lovable/Trae-ready UI generation prompt plus a verdict on
-- whether the client's brief is real & complete or needs admin intervention.
-- ui_prompt_verdict: NULL = never generated, 'ready', 'needs_admin'.
ALTER TABLE orders
  ADD COLUMN ui_prompt TEXT,
  ADD COLUMN ui_prompt_verdict VARCHAR(16),
  ADD COLUMN ui_prompt_missing TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN ui_prompt_at TIMESTAMPTZ;
