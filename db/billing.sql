-- Accès et quotas utilisateurs
CREATE TABLE IF NOT EXISTS user_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) DEFAULT 'starter',       -- 'starter', 'pro', 'club'
  quota_remaining INTEGER DEFAULT 3,
  quota_total INTEGER DEFAULT 3,
  stripe_customer_id VARCHAR(255),
  trial_started_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  trial_last_reminder_days INTEGER,
  trial_last_reminder_sent_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE user_access ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP;
ALTER TABLE user_access ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
ALTER TABLE user_access ADD COLUMN IF NOT EXISTS trial_last_reminder_days INTEGER;
ALTER TABLE user_access ADD COLUMN IF NOT EXISTS trial_last_reminder_sent_at TIMESTAMP;

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
