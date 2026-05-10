import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cancelPlan } from '@/lib/billing';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  try {
    await cancelPlan(session.user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[account/subscription]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
