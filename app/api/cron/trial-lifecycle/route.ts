import { NextRequest, NextResponse } from 'next/server';
import {
  expireClubTrialsToStarter,
  getTrialUsersForReminder,
  markTrialReminderSent,
} from '@/lib/billing';
import {
  buildTrialEndedEmail,
  buildTrialReminderEmail,
  sendEmail,
} from '@/lib/email';

const REMINDER_WINDOWS = [14, 7, 2] as const;

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[cron/trial-lifecycle] CRON_SECRET manquant.');
    return false;
  }

  const bearer = req.headers.get('authorization');
  if (bearer === `Bearer ${cronSecret}`) {
    return true;
  }

  const headerSecret = req.headers.get('x-cron-secret');
  return headerSecret === cronSecret;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  const summary = {
    remindersSent: 0,
    remindersFailed: 0,
    downgradedToStarter: 0,
    downgradeEmailsFailed: 0,
  };

  for (const daysBeforeEnd of REMINDER_WINDOWS) {
    const users = await getTrialUsersForReminder(daysBeforeEnd);

    for (const user of users) {
      const trialEndsAt = new Date(user.trial_ends_at);
      try {
        await sendEmail({
          to: user.email,
          subject: `Tifo - Plus que ${daysBeforeEnd} jour${daysBeforeEnd > 1 ? 's' : ''} sur votre essai Club`,
          html: buildTrialReminderEmail(user.name, trialEndsAt, daysBeforeEnd, appUrl),
          text: `Votre essai Club se termine le ${trialEndsAt.toLocaleDateString('fr-FR')}. Choisissez votre offre depuis votre compte.`,
        });
        await markTrialReminderSent(user.user_id, daysBeforeEnd);
        summary.remindersSent += 1;
      } catch (error) {
        summary.remindersFailed += 1;
        console.error('[cron/trial-lifecycle/reminder]', {
          userId: user.user_id,
          email: user.email,
          daysBeforeEnd,
          error,
        });
      }
    }
  }

  const downgradedUsers = await expireClubTrialsToStarter();
  summary.downgradedToStarter = downgradedUsers.length;

  for (const user of downgradedUsers) {
    try {
      await sendEmail({
        to: user.email,
        subject: 'Tifo - Votre essai Club est terminé',
        html: buildTrialEndedEmail(user.name, appUrl),
        text: 'Votre essai Club est terminé et votre compte est repassé sur Starter. Vous pouvez souscrire à tout moment depuis votre compte.',
      });
    } catch (error) {
      summary.downgradeEmailsFailed += 1;
      console.error('[cron/trial-lifecycle/end-email]', {
        userId: user.user_id,
        email: user.email,
        error,
      });
    }
  }

  return NextResponse.json({ success: true, summary });
}
