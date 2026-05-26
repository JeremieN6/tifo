import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllUsers, getUserById, logAdminAction, setUserAdmin, setUserPlan } from '@/lib/admin';
import {
  buildSignupWelcomeEmail,
  buildTrialEndedEmail,
  buildTrialReminderEmail,
  buildTrialWelcomeEmail,
  sendEmail,
} from '@/lib/email';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const users = await getAllUsers();
  return NextResponse.json(users);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const { userId, plan } = await req.json();

  if (!userId || !plan) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }

  const allowedPlans = ['starter', 'pro', 'club', 'club_trial_90'];
  if (!allowedPlans.includes(plan)) {
    return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 });
  }

  const beforeUser = await getUserById(String(userId));

  if (plan === 'club_trial_90') {
    await setUserPlan(String(userId), 'club', Number(process.env.TRIAL_DAYS ?? 90));
  } else {
    await setUserPlan(String(userId), plan, undefined);
  }

  const afterUser = await getUserById(String(userId));
  await logAdminAction({
    actorUserId: String(session.user.id),
    targetUserId: String(userId),
    actionType: 'plan_changed',
    beforeValue: beforeUser,
    afterValue: afterUser,
    metadata: { requestedPlan: plan },
  });

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const { userId, template, subject, message } = await req.json();

  if (!userId || !template) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }

  const user = await getUserById(String(userId));
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const displayName = user.name ?? user.email;
  const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null;

  if (template === 'welcome') {
    await sendEmail({
      to: user.email,
      subject: 'Bienvenue sur Tifo',
      html: buildSignupWelcomeEmail(displayName, appUrl),
      text: 'Bienvenue sur Tifo. Votre compte est créé et prêt à l\'emploi.',
    });
    await logAdminAction({
      actorUserId: String(session.user.id),
      targetUserId: String(userId),
      actionType: 'email_sent',
      metadata: { template },
    });
    return NextResponse.json({ success: true });
  }

  if (template === 'trial_welcome') {
    if (!trialEndsAt) {
      return NextResponse.json({ error: 'Cet utilisateur n\'a pas de date de fin d\'essai.' }, { status: 400 });
    }

    await sendEmail({
      to: user.email,
      subject: 'Bienvenue sur Tifo - Votre plan Club offert est actif',
      html: buildTrialWelcomeEmail(displayName, trialEndsAt, appUrl),
      text: `Votre essai Club est actif jusqu'au ${trialEndsAt.toLocaleDateString('fr-FR')}.`,
    });
    await logAdminAction({
      actorUserId: String(session.user.id),
      targetUserId: String(userId),
      actionType: 'email_sent',
      metadata: { template },
    });
    return NextResponse.json({ success: true });
  }

  if (template === 'trial_reminder_7') {
    if (!trialEndsAt) {
      return NextResponse.json({ error: 'Cet utilisateur n\'a pas de date de fin d\'essai.' }, { status: 400 });
    }

    await sendEmail({
      to: user.email,
      subject: 'Tifo - Plus que 7 jours sur votre essai Club',
      html: buildTrialReminderEmail(displayName, trialEndsAt, 7, appUrl),
      text: `Votre essai Club se termine le ${trialEndsAt.toLocaleDateString('fr-FR')}.`,
    });
    await logAdminAction({
      actorUserId: String(session.user.id),
      targetUserId: String(userId),
      actionType: 'email_sent',
      metadata: { template },
    });
    return NextResponse.json({ success: true });
  }

  if (template === 'trial_ended') {
    await sendEmail({
      to: user.email,
      subject: 'Tifo - Votre essai Club est terminé',
      html: buildTrialEndedEmail(displayName, appUrl),
      text: 'Votre essai Club est terminé et votre compte est repassé sur Starter.',
    });
    await logAdminAction({
      actorUserId: String(session.user.id),
      targetUserId: String(userId),
      actionType: 'email_sent',
      metadata: { template },
    });
    return NextResponse.json({ success: true });
  }

  if (template === 'custom') {
    if (!subject || !message) {
      return NextResponse.json({ error: 'Sujet et message requis pour un email custom.' }, { status: 400 });
    }

    const html = `<div style="font-family:Arial,sans-serif;background:#020f07;color:#f8fafc;padding:24px;"><div style="max-width:640px;margin:0 auto;background:#052e16;border:1px solid #166534;padding:28px;"><h1 style="margin:0 0 16px;color:#ffffff;">Tifo</h1><div style="color:#d1d5db;line-height:1.6;white-space:pre-wrap;">${String(message)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />')}</div></div></div>`;

    await sendEmail({
      to: user.email,
      subject: String(subject),
      html,
      text: String(message),
    });
    await logAdminAction({
      actorUserId: String(session.user.id),
      targetUserId: String(userId),
      actionType: 'email_sent',
      metadata: { template, subject },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Template invalide.' }, { status: 400 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const { userId, isAdmin } = await req.json();
  if (!userId || typeof isAdmin !== 'boolean') {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }

  if (String(userId) === String(session.user.id) && !isAdmin) {
    return NextResponse.json({ error: 'Vous ne pouvez pas retirer votre propre rôle admin.' }, { status: 400 });
  }

  const beforeUser = await getUserById(String(userId));
  await setUserAdmin(String(userId), isAdmin);
  await logAdminAction({
    actorUserId: String(session.user.id),
    targetUserId: String(userId),
    actionType: 'admin_toggled',
    beforeValue: beforeUser,
    afterValue: { ...beforeUser, is_admin: isAdmin },
    metadata: { isAdmin },
  });
  return NextResponse.json({ success: true });
}
