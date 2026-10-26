-- ============================================================================
-- ROX Agency API — initial schema
-- Mirrors api-spec.json:
--   Auth: client_account, admin_account, refresh_token
--   Portal: orders, order_task, order_event, change_request, service_history,
--           message, call_booking
--   Portfolio: portfolio_item
--   Content: service_content + service_extra, plan, faq_group, site_info
--   Analytics: traffic_point
-- ============================================================================

CREATE TABLE client_account (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_account (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  name           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_token (
  jti         TEXT PRIMARY KEY,
  subject     TEXT NOT NULL,
  role        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE orders (
  id           TEXT PRIMARY KEY,
  client_id    TEXT NOT NULL REFERENCES client_account(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  service      TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  budget       TEXT NOT NULL DEFAULT '',
  deadline     TEXT NOT NULL DEFAULT '',
  phase        TEXT NOT NULL,
  status       TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_client ON orders(client_id, created_at DESC);

CREATE TABLE order_task (
  id          TEXT PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  position    INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_task_order ON order_task(order_id, position);

CREATE TABLE order_event (
  id        TEXT PRIMARY KEY,
  order_id  TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  note      TEXT NOT NULL
);
CREATE INDEX idx_event_order ON order_event(order_id, at DESC);

CREATE TABLE change_request (
  id        TEXT PRIMARY KEY,
  order_id  TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type      TEXT NOT NULL,
  note      TEXT NOT NULL,
  at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  status    TEXT NOT NULL
);
CREATE INDEX idx_cr_order ON change_request(order_id, at DESC);

CREATE TABLE service_history (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service    TEXT NOT NULL,
  year       TEXT NOT NULL,
  outcome    TEXT NOT NULL
);
CREATE INDEX idx_sh_order ON service_history(order_id);

CREATE TABLE message (
  id         TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL REFERENCES client_account(id) ON DELETE CASCADE,
  order_id   TEXT REFERENCES orders(id) ON DELETE SET NULL,
  at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender     TEXT NOT NULL,
  text       TEXT NOT NULL
);
CREATE INDEX idx_msg_client ON message(client_id, at);

CREATE TABLE call_booking (
  id          TEXT PRIMARY KEY,
  client_id   TEXT NOT NULL REFERENCES client_account(id) ON DELETE CASCADE,
  book_date   DATE NOT NULL,
  book_time   TIME NOT NULL,
  subject     TEXT NOT NULL,
  status      TEXT NOT NULL
);
CREATE INDEX idx_booking_client ON call_booking(client_id, book_date);

CREATE TABLE portfolio_item (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  client      TEXT NOT NULL,
  sector      TEXT NOT NULL,
  service     TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  summary     TEXT NOT NULL DEFAULT '',
  result      TEXT NOT NULL DEFAULT '',
  tags        TEXT[] NOT NULL DEFAULT '{}',
  color_a     TEXT NOT NULL DEFAULT '#E31B23',
  color_b     TEXT NOT NULL DEFAULT '#111827',
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pf_published ON portfolio_item(published) WHERE published;
CREATE INDEX idx_pf_featured  ON portfolio_item(featured)  WHERE featured;
CREATE INDEX idx_pf_sector    ON portfolio_item(sector);

CREATE TABLE service_content (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  tag          TEXT NOT NULL DEFAULT '',
  icon         TEXT NOT NULL DEFAULT 'Globe',
  short        TEXT NOT NULL DEFAULT '',
  faq_key      TEXT NOT NULL DEFAULT 'general',
  published    BOOLEAN NOT NULL DEFAULT FALSE,
  eyebrow      TEXT NOT NULL DEFAULT 'Service',
  title        TEXT NOT NULL DEFAULT '',
  lead         TEXT NOT NULL DEFAULT '',
  heading      TEXT NOT NULL DEFAULT '',
  subtext      TEXT NOT NULL DEFAULT '',
  points       TEXT[] NOT NULL DEFAULT '{}',
  price_label  TEXT NOT NULL DEFAULT '',
  price_value  TEXT NOT NULL DEFAULT '',
  position     INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_svc_published ON service_content(published, position);

CREATE TABLE service_extra (
  id          TEXT PRIMARY KEY,
  service_id  TEXT NOT NULL REFERENCES service_content(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  text        TEXT NOT NULL,
  position    INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_extra_service ON service_extra(service_id, position);

CREATE TABLE plan (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  price        TEXT NOT NULL DEFAULT '',
  unit         TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  highlight    BOOLEAN NOT NULL DEFAULT FALSE,
  features     TEXT[] NOT NULL DEFAULT '{}',
  position     INT NOT NULL DEFAULT 0
);

CREATE TABLE faq_group (
  name      TEXT PRIMARY KEY,
  items     JSONB NOT NULL DEFAULT '[]'::jsonb,
  position  INT NOT NULL DEFAULT 0
);

CREATE TABLE site_info (
  id            INT PRIMARY KEY CHECK (id = 1),
  email         TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  whatsapp      TEXT NOT NULL DEFAULT '',
  cities        TEXT[] NOT NULL DEFAULT '{}',
  pricing_note  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE traffic_point (
  id        TEXT PRIMARY KEY,
  month     TEXT NOT NULL,
  year      INT NOT NULL,
  views     INT NOT NULL DEFAULT 0,
  contacts  INT NOT NULL DEFAULT 0,
  UNIQUE (month, year)
);
