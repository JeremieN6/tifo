-- Attribution "first-touch" : d'ou vient chaque inscrit (capturee cote navigateur, enregistree a l'inscription).
-- Une ligne par compte cree apres la mise en ligne : sa presence rend le compte eligible a la fenetre de question.
CREATE TABLE IF NOT EXISTS user_attribution (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  referrer_domain VARCHAR(255),
  landing_path VARCHAR(255),
  device_type VARCHAR(10),
  has_signal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reponse a la question "Ou avez-vous connu Tifo ?" posee apres la premiere generation reussie.
-- status = 'answered' ou 'dismissed' (fermee sans repondre : on ne la repose pas).
CREATE TABLE IF NOT EXISTS acquisition_survey (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL CHECK (status IN ('answered', 'dismissed')),
  channel VARCHAR(20),
  channel_other VARCHAR(200),
  query_text VARCHAR(600),
  answered_at TIMESTAMP DEFAULT NOW()
);
