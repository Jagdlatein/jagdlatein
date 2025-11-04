import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);
export const MAIL_FROM = process.env.MAIL_FROM!;
export const APP_NAME = process.env.APP_NAME ?? 'Jagdlatein';

export async function sendPurchaseEmail(to: string, loginUrl: string) {
  const subject = `${APP_NAME}: Zugang nach Kauf`;
  const html = `
  <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
    <h2>Vielen Dank für deinen Kauf!</h2>
    <p>So greifst du zu:</p>
    <ol>
      <li>Klick auf <a href="${loginUrl}">Login</a> und melde dich mit deiner E-Mail an.</li>
      <li>Falls noch kein Passwort gesetzt wurde, nutze "Passwort zurücksetzen".</li>
      <li>Danach findest du das Quiz im Menü.</li>
    </ol>
    <p>Waidmannsheil,<br/>dein ${APP_NAME}-Team</p>
  </div>`;
  await resend.emails.send({ from: MAIL_FROM, to, subject, html });
}
