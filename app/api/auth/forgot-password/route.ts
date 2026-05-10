import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createPasswordResetToken } from '@/lib/password-reset';
import { sendEmail, buildPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    // Toujours retourner succès pour ne pas révéler si l'email existe
    if (user) {
      const token = await createPasswordResetToken(String(user.id));
      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
      const html = buildPasswordResetEmail(user.name ?? email, token, baseUrl);

      await sendEmail({
        to: email,
        subject: 'Réinitialisation de ton mot de passe Tifo',
        html,
        text: `Clique sur ce lien pour réinitialiser ton mot de passe : ${baseUrl}/auth/reset-password?token=${token}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
