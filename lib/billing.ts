import pool from './db';

export interface UserAccess {
  plan: 'starter' | 'pro' | 'club';
  quota_remaining: number;
  quota_total: number;
  stripe_customer_id: string | null;
}

export async function getUserAccess(userId: string): Promise<UserAccess | null> {
  const result = await pool.query(
    'SELECT plan, quota_remaining, quota_total, stripe_customer_id FROM user_access WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] ?? null;
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
     SET plan = $1, quota_remaining = $2, quota_total = $3, updated_at = NOW()
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

export async function cancelPlan(userId: string): Promise<void> {
  await pool.query(
    `UPDATE user_access SET plan = 'starter', quota_remaining = 5, quota_total = 5, updated_at = NOW()
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
