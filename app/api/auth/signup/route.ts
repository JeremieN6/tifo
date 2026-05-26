import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/users';
import pool from '@/lib/db';
import { captureServerEvent } from '@/lib/posthog-server';
import { buildSignupWelcomeEmail, sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
    }

    // Vérifier si l'email existe déjà
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      captureServerEvent({
        distinctId: 'anonymous',
        event: 'signup_failed',
        properties: { reason: 'email_already_exists' },
      });
      return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 });
    }

    const user = await createUser(email, password, name);

    try {
      const appUrl = req.nextUrl.origin;
      await sendEmail({
        to: user.email,
        subject: 'Bienvenue sur Tifo',
        html: buildSignupWelcomeEmail(user.name ?? user.email, appUrl),
        text: 'Bienvenue sur Tifo. Votre compte est créé et prêt à l\'emploi.',
      });
    } catch (emailError) {
      console.error('[signup/welcome-email]', emailError);
    }

    captureServerEvent({
      distinctId: user.id,
      event: 'signup_succeeded',
      properties: { has_name: Boolean(name) },
    });
    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err) {
    captureServerEvent({
      distinctId: 'anonymous',
      event: 'signup_failed',
      properties: { reason: 'server_error' },
    });
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
