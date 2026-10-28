-- Hamid Astronomy CMS schema. Safe to re-run on an existing deployment.
-- PostgreSQL 17+ / Neon.
CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_items (
  id text PRIMARY KEY,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  description text NOT NULL DEFAULT '',
  type text NOT NULL CHECK (type IN ('image','video')),
  category text NOT NULL,
  image text NOT NULL,
  video_url text,
  duration text,
  captured_at text NOT NULL DEFAULT '',
  views integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  likes integer NOT NULL DEFAULT 0 CHECK (likes >= 0),
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_items_published_idx ON media_items (published, created_at DESC);

CREATE TABLE IF NOT EXISTS cms_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  event_type text NOT NULL DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS cms_notifications_recent_idx ON cms_notifications (created_at DESC);

-- Standalone text posts can be published without a cover image; existing media stays intact.
CREATE TABLE IF NOT EXISTS text_posts (
  id text PRIMARY KEY,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 160),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 10000),
  category text NOT NULL DEFAULT 'نوشته‌ها',
  image text NOT NULL DEFAULT '',
  captured_at text NOT NULL DEFAULT '',
  views integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  likes integer NOT NULL DEFAULT 0 CHECK (likes >= 0),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS text_posts_published_idx ON text_posts (published, created_at DESC);

-- CMS-managed categories. The original media/text records remain unchanged.
CREATE TABLE IF NOT EXISTS site_categories (
  name text PRIMARY KEY CHECK (char_length(name) BETWEEN 2 AND 60 AND name = btrim(name)),
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO site_categories (name, sort_order) VALUES
  ('سحابی‌ها', 10), ('کهکشان‌ها', 20), ('منظومه شمسی', 30),
  ('ماه', 40), ('ویدیوها', 50), ('نوشته‌ها', 60)
ON CONFLICT (name) DO NOTHING;
INSERT INTO site_categories (name, sort_order)
  SELECT category, 100 FROM (
    SELECT DISTINCT category FROM media_items
    UNION SELECT DISTINCT category FROM text_posts
  ) previous
  WHERE char_length(category) BETWEEN 2 AND 60 AND category = btrim(category)
ON CONFLICT (name) DO NOTHING;
