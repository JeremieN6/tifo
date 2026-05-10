import pool from './db';

export interface PosterRecord {
  id: number;
  prompt: string | null;
  image_url: string | null;  // URL publique Vercel Blob, pas base64
  settings: Record<string, unknown> | null;
  created_at: string;
}

export async function savePosterHistory(
  userId: string,
  prompt: string,
  imageUrl: string,  // URL Vercel Blob
  settings: Record<string, unknown>
): Promise<void> {
  await pool.query(
    'INSERT INTO poster_history (user_id, prompt, image_data, settings) VALUES ($1, $2, $3, $4)',
    [userId, prompt, imageUrl, JSON.stringify(settings)]
  );
}

export async function getPosterHistory(userId: string): Promise<PosterRecord[]> {
  const result = await pool.query(
    'SELECT id, prompt, image_data as image_url, settings, created_at FROM poster_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return result.rows;
}
