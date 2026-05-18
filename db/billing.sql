-- Accès et quotas utilisateurs
CREATE TABLE IF NOT EXISTS user_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) DEFAULT 'starter',       -- 'starter', 'pro', 'club'
  quota_remaining INTEGER DEFAULT 3,
  quota_total INTEGER DEFAULT 3,
  stripe_customer_id VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Événements de paiement
CREATE TABLE IF NOT EXISTS payment_events (
  id SERIAL PRIMARY KEY,
  stripe_event_id VARCHAR(255) UNIQUE,
  user_email VARCHAR(255),
  event_type VARCHAR(100),
  amount INTEGER,
  currency VARCHAR(10),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
