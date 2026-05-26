import bcrypt from 'bcryptjs';
import pool from './db';

export async function createUser(email: string, password: string, name?: string) {
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [email.toLowerCase().trim(), hash, name ?? null]
  );
  const user = result.rows[0];
  // Création par défaut en Starter. Les essais Club sont attribués manuellement au cas par cas.
  await pool.query(
    `INSERT INTO user_access (user_id, plan, quota_remaining, quota_total)
     VALUES ($1, 'starter', 3, 3)`,
    [user.id]
  );

  return user;
}

export async function getUserByEmail(email: string) {
  const result = await pool.query(
    'SELECT id, email, name, created_at FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  return result.rows[0] ?? null;
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
}
