import crypto from 'crypto';
import pool from './db';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  // Invalider les anciens tokens
  await pool.query(
    "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE",
    [userId]
  );

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  return token;
}

export async function validatePasswordResetToken(
  token: string
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(token);

  const result = await pool.query(
    `SELECT user_id FROM password_reset_tokens
     WHERE token_hash = $1 AND used = FALSE AND expires_at > NOW()`,
    [tokenHash]
  );

  if (!result.rows[0]) return null;

  // Marquer comme utilisé
  await pool.query(
    'UPDATE password_reset_tokens SET used = TRUE WHERE token_hash = $1',
    [tokenHash]
  );

  return { userId: String(result.rows[0].user_id) };
}
