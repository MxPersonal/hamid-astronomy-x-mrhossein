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
