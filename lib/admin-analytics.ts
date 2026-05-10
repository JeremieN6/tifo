import pool from './db';

export async function getAdminStats() {
  const [usersResult, paymentsResult, postersResult] = await Promise.all([
    pool.query('SELECT COUNT(*) as total FROM users'),
    pool.query('SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as revenue FROM payment_events WHERE status = $1', ['completed']),
    pool.query('SELECT COUNT(*) as total FROM poster_history'),
  ]);

  const planBreakdown = await pool.query(
    `SELECT plan, COUNT(*) as count FROM user_access GROUP BY plan ORDER BY plan`
  );

  return {
    totalUsers: Number(usersResult.rows[0]?.total ?? 0),
    totalRevenueCents: Number(paymentsResult.rows[0]?.revenue ?? 0),
    totalPayments: Number(paymentsResult.rows[0]?.total ?? 0),
    totalPosters: Number(postersResult.rows[0]?.total ?? 0),
    planBreakdown: planBreakdown.rows,
  };
}
