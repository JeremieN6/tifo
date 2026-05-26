interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasSmtp = Boolean(process.env.SMTP_HOST);

  if (!hasResend && !hasSmtp) {
    console.warn('[email] Aucun fournisseur configuré. Email non envoyé:', opts.subject);
    return;
  }

  if (hasResend) {
    try {
      await sendViaResend(opts);
      return;
    } catch (error) {
      console.error('[email] Echec Resend, fallback SMTP:', error);
      if (!hasSmtp) {
        throw error;
      }
    }
  }

  await sendViaSMTP(opts);
}

async function sendViaResend(opts: SendEmailOptions): Promise<void> {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.SMTP_FROM ?? 'Tifo <noreply@tifo.nanocorp.app>',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

async function sendViaSMTP(opts: SendEmailOptions): Promise<void> {
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'Tifo <noreply@tifo.nanocorp.app>',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

export function buildPasswordResetEmail(name: string, token: string, baseUrl: string): string {
  const link = `${baseUrl}/auth/reset-password?token=${token}`;
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Réinitialisation de mot de passe</title></head>
<body style="font-family: sans-serif; background:#111; color:#fff; padding:40px;">
  <h1 style="color:#00ff87;">Tifo</h1>
  <p>Bonjour ${name},</p>
  <p>Tu as demandé à réinitialiser ton mot de passe sur Tifo.</p>
  <p>Clique sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
  <a href="${link}" style="display:inline-block;background:#00ff87;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
    Réinitialiser mon mot de passe
  </a>
  <p style="color:#9ca3af;margin-top:24px;">Ce lien expire dans 1 heure. Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
  <p style="color:#9ca3af;">L'équipe Tifo</p>
</body>
</html>
`;
}

export function buildSignupWelcomeEmail(name: string, appUrl: string): string {
  const safeName = name?.trim() || 'Champion';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur Tifo</title>
</head>
<body style="margin:0;padding:0;background:#020f07;color:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#052e16;border:1px solid #166534;">
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 6px;color:#22c55e;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Bienvenue</p>
              <h1 style="margin:0 0 14px;font-size:32px;line-height:1.1;color:#ffffff;">Heureux de vous accueillir, ${safeName}</h1>
              <p style="margin:0 0 14px;color:#d1d5db;font-size:16px;line-height:1.5;">
                Votre compte Tifo est bien créé. Vous pouvez maintenant générer vos visuels et configurer votre espace.
              </p>
              <p style="margin:0 0 20px;color:#d1d5db;font-size:14px;line-height:1.5;">
                Merci de votre confiance et bienvenue dans l'aventure Tifo.
              </p>
              <a href="${appUrl}/dashboard" style="display:inline-block;padding:12px 20px;background:#22c55e;color:#052e16;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1px;font-size:12px;">
                Ouvrir mon dashboard
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function buildTrialWelcomeEmail(name: string, trialEndsAt: Date, appUrl: string): string {
  const safeName = name?.trim() || 'Champion';
  const formattedDate = formatDateFr(trialEndsAt);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur Tifo</title>
</head>
<body style="margin:0;padding:0;background:#020f07;color:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#052e16;border:1px solid #166534;">
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 6px;color:#22c55e;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Bienvenue fondateur</p>
              <h1 style="margin:0 0 14px;font-size:32px;line-height:1.1;color:#ffffff;">Bienvenue sur Tifo, ${safeName}</h1>
              <p style="margin:0 0 14px;color:#d1d5db;font-size:16px;line-height:1.5;">
                Votre compte est actif et vous bénéficiez dès maintenant du plan Club offert pendant 3 mois.
              </p>
              <p style="margin:0 0 20px;color:#bbf7d0;font-size:16px;font-weight:700;">
                Essai offert jusqu'au ${formattedDate}
              </p>
              <p style="margin:0 0 22px;color:#d1d5db;font-size:14px;line-height:1.5;">
                Profitez de toutes les fonctionnalités premium pour créer vos visuels, structurer vos contenus et accélérer votre communication.
              </p>
              <a href="${appUrl}/dashboard" style="display:inline-block;padding:12px 20px;background:#22c55e;color:#052e16;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1px;font-size:12px;">
                Accéder à mon dashboard
              </a>
              <p style="margin:22px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
                Merci de faire partie des premiers clubs à lancer l'aventure Tifo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildTrialReminderEmail(name: string, trialEndsAt: Date, daysLeft: number, appUrl: string): string {
  const safeName = name?.trim() || 'Champion';
  const formattedDate = formatDateFr(trialEndsAt);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rappel essai Tifo</title>
</head>
<body style="margin:0;padding:0;background:#020f07;color:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#052e16;border:1px solid #166534;">
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 8px;color:#22c55e;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Rappel essai club</p>
              <h1 style="margin:0 0 14px;font-size:30px;line-height:1.1;color:#ffffff;">Plus que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} de plan Club offert</h1>
              <p style="margin:0 0 14px;color:#d1d5db;font-size:16px;line-height:1.5;">
                Bonjour ${safeName}, votre période d'essai se termine le ${formattedDate}.
              </p>
              <p style="margin:0 0 20px;color:#d1d5db;font-size:14px;line-height:1.5;">
                Pour continuer à profiter de l'expérience complète, choisissez votre offre avant la fin de l'essai.
              </p>
              <a href="${appUrl}/account" style="display:inline-block;padding:12px 20px;background:#22c55e;color:#052e16;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1px;font-size:12px;">
                Choisir mon offre
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildTrialEndedEmail(name: string, appUrl: string): string {
  const safeName = name?.trim() || 'Champion';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fin de votre essai Tifo</title>
</head>
<body style="margin:0;padding:0;background:#020f07;color:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#052e16;border:1px solid #166534;">
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 8px;color:#22c55e;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Mise à jour compte</p>
              <h1 style="margin:0 0 14px;font-size:30px;line-height:1.1;color:#ffffff;">Votre essai Club est terminé</h1>
              <p style="margin:0 0 14px;color:#d1d5db;font-size:16px;line-height:1.5;">
                Bonjour ${safeName}, votre compte est maintenant repassé automatiquement sur le plan Starter.
              </p>
              <p style="margin:0 0 20px;color:#d1d5db;font-size:14px;line-height:1.5;">
                Vous pouvez revenir sur un plan Pro ou Club à tout moment depuis votre espace compte.
              </p>
              <a href="${appUrl}/account" style="display:inline-block;padding:12px 20px;background:#22c55e;color:#052e16;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1px;font-size:12px;">
                Voir les offres
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
