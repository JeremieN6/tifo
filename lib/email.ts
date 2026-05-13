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
