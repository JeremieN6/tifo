import pool from './db';

interface AdminActionLogOptions {
  actorUserId: string;
  targetUserId: string;
  actionType: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  metadata?: unknown;
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const adminEmails = (process.env.TIFO_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function getAllUsers() {
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.created_at, u.is_admin,
            a.plan, a.quota_remaining, a.quota_total, a.trial_ends_at
     FROM users u
     LEFT JOIN user_access a ON a.user_id = u.id
     ORDER BY u.created_at DESC`
  );
  return result.rows;
}

export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<void> {
  await pool.query('UPDATE users SET is_admin = $1 WHERE id = $2', [isAdmin, userId]);
}

export async function getUserById(userId: string) {
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, a.plan, a.trial_ends_at
     FROM users u
     LEFT JOIN user_access a ON a.user_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function setUserQuota(userId: string, quotaRemaining: number): Promise<void> {
  await pool.query(
    'UPDATE user_access SET quota_remaining = $1, updated_at = NOW() WHERE user_id = $2',
    [quotaRemaining, userId]
  );
}

export async function setUserPlan(
  userId: string,
  plan: 'starter' | 'pro' | 'club',
  trialDays?: number
): Promise<void> {
  if (plan === 'starter') {
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
    return;
  }

  if (plan === 'pro') {
    await pool.query(
      `UPDATE user_access
       SET
         plan = 'pro',
         quota_remaining = 999999,
         quota_total = 999999,
         trial_started_at = NULL,
         trial_ends_at = NULL,
         trial_last_reminder_days = NULL,
         trial_last_reminder_sent_at = NULL,
         updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
    return;
  }

  if (trialDays && trialDays > 0) {
    await pool.query(
      `UPDATE user_access
       SET
         plan = 'club',
         quota_remaining = 999999,
         quota_total = 999999,
         trial_started_at = NOW(),
         trial_ends_at = NOW() + ($2 || ' days')::interval,
         trial_last_reminder_days = NULL,
         trial_last_reminder_sent_at = NULL,
         updated_at = NOW()
       WHERE user_id = $1`,
      [userId, trialDays]
    );
    return;
  }

  await pool.query(
    `UPDATE user_access
     SET
       plan = 'club',
       quota_remaining = 999999,
       quota_total = 999999,
       trial_started_at = NULL,
       trial_ends_at = NULL,
       trial_last_reminder_days = NULL,
       trial_last_reminder_sent_at = NULL,
       updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );
}

export async function logAdminAction({
  actorUserId,
  targetUserId,
  actionType,
  beforeValue,
  afterValue,
  metadata,
}: AdminActionLogOptions): Promise<void> {
  await pool.query(
    `INSERT INTO admin_action_logs (actor_user_id, target_user_id, action_type, before_value, after_value, metadata)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb)`,
    [
      actorUserId,
      targetUserId,
      actionType,
      beforeValue ? JSON.stringify(beforeValue) : null,
      afterValue ? JSON.stringify(afterValue) : null,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
}

export async function getAdminActionLogs(limit = 50) {
  const result = await pool.query(
    `SELECT
      l.id,
      l.action_type,
      l.before_value,
      l.after_value,
      l.metadata,
      l.created_at,
      actor.email AS actor_email,
      target.email AS target_email
     FROM admin_action_logs l
     LEFT JOIN users actor ON actor.id = l.actor_user_id
     LEFT JOIN users target ON target.id = l.target_user_id
     ORDER BY l.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}
