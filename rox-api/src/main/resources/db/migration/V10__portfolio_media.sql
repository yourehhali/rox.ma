-- ============================================================================
-- V10 — Portfolio media (thumbnail + gallery)
-- Each realisation can now carry an optional cover thumbnail and an ordered set
-- of gallery images for its single project page. Both are nullable/optional:
-- when absent the frontend falls back to the existing gradient + mock-browser
-- cover design. Images are served from the /uploads/** static handler (files
-- stored on disk under ROX_UPLOAD_DIR), so only their public paths live here.
-- ============================================================================

ALTER TABLE portfolio_item
  ADD COLUMN thumbnail_url TEXT,
  ADD COLUMN gallery_urls  TEXT[] NOT NULL DEFAULT '{}';
