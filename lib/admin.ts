import pool from './db';

export async function isAdminEmail(email: string): Promise<boolean> {
  const adminEmails = (process.env.TIFO_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function getAllUsers() {
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.created_at,
            a.plan, a.quota_remaining, a.quota_total
     FROM users u
     LEFT JOIN user_access a ON a.user_id = u.id
     ORDER BY u.created_at DESC`
  );
  return result.rows;
}

export async function setUserQuota(userId: string, quotaRemaining: number): Promise<void> {
  await pool.query(
    'UPDATE user_access SET quota_remaining = $1, updated_at = NOW() WHERE user_id = $2',
    [quotaRemaining, userId]
  );
}
