import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPaymentHistory } from '@/lib/billing';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const history = await getPaymentHistory(session.user.id);
  return NextResponse.json(history);
}
