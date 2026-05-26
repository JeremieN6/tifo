import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserById, logAdminAction, setUserQuota } from '@/lib/admin';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const { userId, quotaRemaining } = await req.json();
  if (!userId || quotaRemaining === undefined) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }

  const beforeUser = await getUserById(String(userId));
  await setUserQuota(String(userId), Number(quotaRemaining));
  const afterUser = await getUserById(String(userId));
  await logAdminAction({
    actorUserId: String(session.user.id),
    targetUserId: String(userId),
    actionType: 'quota_updated',
    beforeValue: beforeUser,
    afterValue: afterUser,
    metadata: { quotaRemaining: Number(quotaRemaining) },
  });
  return NextResponse.json({ success: true });
}
