import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { setUserQuota } from '@/lib/admin';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const { userId, quotaRemaining } = await req.json();
  if (!userId || quotaRemaining === undefined) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }

  await setUserQuota(String(userId), Number(quotaRemaining));
  return NextResponse.json({ success: true });
}
