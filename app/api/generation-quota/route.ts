import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserAccess } from '@/lib/billing';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const access = await getUserAccess(session.user.id);
  if (!access) {
    return NextResponse.json({ error: 'Accès introuvable.' }, { status: 404 });
  }

  return NextResponse.json({
    plan: access.plan,
    quota_remaining: access.quota_remaining,
    quota_total: access.quota_total,
    trial_ends_at: access.trial_ends_at,
  });
}
