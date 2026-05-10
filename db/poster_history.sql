-- Historique des affiches générées
CREATE TABLE IF NOT EXISTS poster_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT,
  image_data TEXT,  -- base64 ou URL
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
