// Envoi d'emails transactionnels — magic links, confirmations.
// Utilise Resend si RESEND_API_KEY est défini, sinon tombe en stub console pour le dev.

import { Resend } from 'resend';

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? 'Monétika <onboarding@resend.dev>';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendTransactionalEmail({ to, subject, html, text }: EmailPayload): Promise<void> {
  if (!API_KEY) {
    console.log('[email stub] RESEND_API_KEY absent — pas d\u2019envoi réel.');
    console.log(`  À: ${to}`);
    console.log(`  Objet: ${subject}`);
    console.log(`  Texte: ${text}`);
    return;
  }

  const resend = new Resend(API_KEY);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error('[email] échec envoi Resend', error);
    throw new Error(`Échec envoi e-mail : ${error.message}`);
  }
}

// Template HTML pour le magic link — tons Monétika, Fraunces (fallback serif), InstrumentSans.
export function renderMagicLinkEmail({
  link,
  firstName,
  locale,
}: {
  link: string;
  firstName?: string | null;
  locale: 'fr' | 'en';
}): { html: string; text: string; subject: string } {
  const isFr = locale === 'fr';
  const greeting = firstName
    ? isFr
      ? `Bonjour ${firstName},`
      : `Hello ${firstName},`
    : isFr
      ? 'Bonjour,'
      : 'Hello,';
  const subject = isFr
    ? 'Votre lien de connexion Monétika'
    : 'Your Monétika sign-in link';
  const body1 = isFr
    ? 'Voici votre lien pour vous connecter à Monétika. Il expire dans 15 minutes.'
    : 'Here is your link to sign in to Monétika. It expires in 15 minutes.';
  const cta = isFr ? 'Se connecter' : 'Sign in';
  const body2 = isFr
    ? "Si vous n'avez pas demandé ce lien, ignorez cet e-mail."
    : "If you did not request this link, ignore this e-mail.";

  const text = `${greeting}\n\n${body1}\n\n${link}\n\n${body2}\n\nMonétika`;

  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F5F1E8;font-family:'Instrument Sans',ui-sans-serif,system-ui,sans-serif;color:#17160F;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1E8;padding:48px 24px;">
  <tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#F5F1E8;">
      <tr><td style="padding-bottom:40px;">
        <span style="font-family:'Fraunces','Georgia',serif;font-style:italic;font-size:28px;color:#1F4D3F;letter-spacing:-0.01em;">Monétika</span>
      </td></tr>
      <tr><td>
        <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#5B7A5E;font-family:ui-monospace,Menlo,monospace;">
          ${isFr ? 'Connexion' : 'Sign-in'}
        </p>
        <h1 style="margin:0 0 24px;font-family:'Fraunces','Georgia',serif;font-weight:500;font-size:28px;line-height:1.15;letter-spacing:-0.015em;color:#17160F;">
          ${greeting}
        </h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#17160F;">${body1}</p>
        <p style="margin:32px 0;">
          <a href="${link}" style="display:inline-block;background:#1F4D3F;color:#F5F1E8;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:500;font-size:16px;">
            ${cta}
          </a>
        </p>
        <hr style="border:none;border-top:1px solid #D9D2BF;margin:32px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#5B7A5E;line-height:1.6;">${body2}</p>
        <p style="margin:0;font-size:12px;color:#5B7A5E;word-break:break-all;">${link}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return { html, text, subject };
}
