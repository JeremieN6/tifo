import { NextRequest, NextResponse } from 'next/server';
import { validatePasswordResetToken } from '@/lib/password-reset';
import { updateUserPassword } from '@/lib/users';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token et mot de passe requis.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
    }

    const result = await validatePasswordResetToken(token);
    if (!result) {
      return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 400 });
    }

    await updateUserPassword(result.userId, password);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[reset-password]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
