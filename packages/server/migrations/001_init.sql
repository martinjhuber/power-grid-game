CREATE TABLE IF NOT EXISTS score_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  player_name VARCHAR(16) NULL,
  score INTEGER NOT NULL,
  client_score INTEGER,
  leaderboard_eligible BOOLEAN NOT NULL,
  verification_result TEXT NOT NULL,
  exclusion_reasons TEXT NOT NULL,
  level_statistics TEXT NOT NULL,
  replay JSONB NOT NULL,
  app_version TEXT,
  edit_token_hash TEXT NULL,
  edit_token_expires_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_score_entries_leaderboard
  ON score_entries (leaderboard_eligible, score DESC);
