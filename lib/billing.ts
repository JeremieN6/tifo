import pool from './db';

export interface UserAccess {
  plan: 'starter' | 'pro' | 'club';
  quota_remaining: number;
  quota_total: number;
  stripe_customer_id: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_last_reminder_days: number | null;
  trial_last_reminder_sent_at: string | null;
}

export interface TrialUser {
  user_id: number;
  email: string;
  name: string;
  trial_ends_at: string;
}

export async function getUserEmail(userId: string): Promise<string | null> {
  const result = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.email ?? null;
}

export async function getUserAccess(userId: string): Promise<UserAccess | null> {
  const result = await pool.query(
    `SELECT
       plan,
       quota_remaining,
       quota_total,
       stripe_customer_id,
       trial_started_at,
       trial_ends_at,
       trial_last_reminder_days,
       trial_last_reminder_sent_at
     FROM user_access
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows[0]) {
    return result.rows[0];
  }

  // Backfill access for legacy/inconsistent accounts to avoid blocking generation.
  await pool.query(
    `INSERT INTO user_access (user_id, plan, quota_remaining, quota_total)
     SELECT $1, 'starter', 3, 3
     WHERE EXISTS (SELECT 1 FROM users WHERE id = $1)`,
    [userId]
  );

  const fallback = await pool.query(
    `SELECT
       plan,
       quota_remaining,
       quota_total,
       stripe_customer_id,
       trial_started_at,
       trial_ends_at,
       trial_last_reminder_days,
       trial_last_reminder_sent_at
     FROM user_access
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId]
  );

  return fallback.rows[0] ?? null;
}

export async function decrementQuota(userId: string): Promise<void> {
  await pool.query(
    'UPDATE user_access SET quota_remaining = GREATEST(quota_remaining - 1, 0), updated_at = NOW() WHERE user_id = $1',
    [userId]
  );
}

export async function upgradePlan(
  userEmail: string,
  plan: 'pro' | 'club',
  stripeEventId: string,
  amount: number
): Promise<void> {
  const quotaMap = { pro: { total: 999999, remaining: 999999 }, club: { total: 999999, remaining: 999999 } };
  const q = quotaMap[plan];

  const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
  const user = userResult.rows[0];
  if (!user) return;

  await pool.query(
    `UPDATE user_access
     SET
       plan = $1,
       quota_remaining = $2,
       quota_total = $3,
       trial_started_at = NULL,
       trial_ends_at = NULL,
       trial_last_reminder_days = NULL,
       trial_last_reminder_sent_at = NULL,
       updated_at = NOW()
     WHERE user_id = $4`,
    [plan, q.remaining, q.total, user.id]
  );

  // Enregistrer l'événement de paiement (ignore si déjà présent)
  await pool.query(
    `INSERT INTO payment_events (stripe_event_id, user_email, event_type, amount, currency, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (stripe_event_id) DO NOTHING`,
    [stripeEventId, userEmail, 'upgrade', amount, 'eur', 'completed']
  );
}

export async function setStripeCustomerId(userEmail: string, stripeCustomerId: string): Promise<void> {
  await pool.query(
    `UPDATE user_access ua
     SET stripe_customer_id = $1, updated_at = NOW()
     FROM users u
     WHERE ua.user_id = u.id AND u.email = $2`,
    [stripeCustomerId, userEmail]
  );
}

export async function getStripeCustomerIdByUserId(userId: string): Promise<string | null> {
  const result = await pool.query(
    'SELECT stripe_customer_id FROM user_access WHERE user_id = $1',
    [userId]
  );
  return result.rows[0]?.stripe_customer_id ?? null;
}

export async function cancelPlan(userId: string): Promise<void> {
  await pool.query(
    `UPDATE user_access
     SET
       plan = 'starter',
       quota_remaining = 3,
       quota_total = 3,
       trial_started_at = NULL,
       trial_ends_at = NULL,
       trial_last_reminder_days = NULL,
       trial_last_reminder_sent_at = NULL,
       updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );
}

export async function getPaymentHistory(userId: string) {
  const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];
  if (!user) return [];

  const result = await pool.query(
    `SELECT event_type, amount, currency, status, created_at
     FROM payment_events WHERE user_email = $1 ORDER BY created_at DESC`,
    [user.email]
  );
  return result.rows;
}

export async function getTrialUsersForReminder(daysBeforeEnd: number): Promise<TrialUser[]> {
  const result = await pool.query(
    `SELECT
      u.id AS user_id,
      u.email,
      COALESCE(NULLIF(u.name, ''), u.email) AS name,
      ua.trial_ends_at
     FROM user_access ua
     JOIN users u ON u.id = ua.user_id
     WHERE
       ua.plan = 'club'
       AND ua.trial_ends_at IS NOT NULL
       AND DATE(ua.trial_ends_at) = CURRENT_DATE + $1
       AND (
         ua.trial_last_reminder_days IS DISTINCT FROM $1
         OR ua.trial_last_reminder_sent_at IS NULL
         OR DATE(ua.trial_last_reminder_sent_at) <> CURRENT_DATE
       )`,
    [daysBeforeEnd]
  );

  return result.rows;
}

export async function markTrialReminderSent(userId: number, daysBeforeEnd: number): Promise<void> {
  await pool.query(
    `UPDATE user_access
     SET
       trial_last_reminder_days = $1,
       trial_last_reminder_sent_at = NOW(),
       updated_at = NOW()
     WHERE user_id = $2`,
    [daysBeforeEnd, userId]
  );
}

export async function expireClubTrialsToStarter(): Promise<TrialUser[]> {
  const result = await pool.query(
    `UPDATE user_access ua
     SET
       plan = 'starter',
       quota_remaining = 3,
       quota_total = 3,
       trial_started_at = NULL,
       trial_ends_at = NULL,
       trial_last_reminder_days = NULL,
       trial_last_reminder_sent_at = NULL,
       updated_at = NOW()
     FROM users u
     WHERE
       ua.user_id = u.id
       AND ua.plan = 'club'
       AND ua.trial_ends_at IS NOT NULL
       AND ua.trial_ends_at <= NOW()
     RETURNING
       u.id AS user_id,
       u.email,
       COALESCE(NULLIF(u.name, ''), u.email) AS name,
       NOW()::text AS trial_ends_at`
  );

  return result.rows;
}
