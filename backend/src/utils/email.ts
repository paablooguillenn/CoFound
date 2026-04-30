import { env } from '../config/env';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async ({ to, subject, html }: SendEmailInput): Promise<void> => {
  if (!env.RESEND_API_KEY) {
    console.log('\n=== [DEV] Email not sent (no RESEND_API_KEY) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html.replace(/<[^>]+>/g, '')}`);
    console.log('================================================\n');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend failed (${response.status}): ${error}`);
  }
};

const LOGO_URL = 'https://co-found-backend.vercel.app/assets/logo-mark.png';

export const renderEmailVerification = (firstName: string, code: string): string => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <title>Verifica tu email — CoFound</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0A0A0A;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background:#141414;border:1px solid #2A2A2A;border-radius:20px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:middle;"><img src="${LOGO_URL}" alt="CoFound" width="40" height="40" style="display:block;border-radius:10px;"></td>
              <td style="padding-left:12px;vertical-align:middle;"><span style="color:#F5F5F5;font-size:20px;font-weight:800;letter-spacing:-0.5px;">CoFound</span></td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <div style="height:1px;background:linear-gradient(90deg,transparent 0%,#4ADE80 50%,transparent 100%);opacity:0.6;"></div>
        </td></tr>
        <tr><td style="padding:32px 32px 8px;">
          <h1 style="margin:0;color:#F5F5F5;font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:32px;">¡Bienvenido a CoFound!</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;">
          <p style="margin:0;color:#A0A0A0;font-size:15px;line-height:23px;">
            Hola <strong style="color:#F5F5F5;font-weight:600;">${firstName}</strong>, gracias por registrarte. Verifica tu email con este código para acceder a todas las funciones.
          </p>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td align="center" style="background:#0A0A0A;border:1px solid #2A2A2A;border-radius:14px;padding:28px 16px;">
              <div style="color:#666666;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Tu código</div>
              <div style="color:#4ADE80;font-size:40px;font-weight:900;letter-spacing:10px;font-family:'SF Mono','Monaco','Menlo',monospace;line-height:48px;">${code}</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:top;padding-top:2px;"><span style="color:#4ADE80;font-size:14px;">●</span></td>
              <td style="padding-left:10px;">
                <p style="margin:0;color:#F5F5F5;font-size:14px;font-weight:600;line-height:22px;">Caduca en 48 horas</p>
                <p style="margin:4px 0 0;color:#A0A0A0;font-size:13px;line-height:20px;">Si no creaste una cuenta en CoFound, ignora este email.</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:32px 32px 0;"><div style="height:1px;background:#2A2A2A;"></div></td></tr>
        <tr><td style="padding:20px 32px 28px;">
          <p style="margin:0 0 6px;color:#A0A0A0;font-size:12px;font-weight:600;line-height:18px;">Encuentra al co-founder que te falta.</p>
          <p style="margin:0;color:#666666;font-size:11px;line-height:17px;">© 2026 CoFound, S.L. · Hecho con café en Madrid</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const renderPasswordResetEmail = (firstName: string, code: string): string => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Tu código de CoFound</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0A0A0A;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background:#141414;border:1px solid #2A2A2A;border-radius:20px;overflow:hidden;">

          <!-- Header con logo -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${LOGO_URL}" alt="CoFound" width="40" height="40" style="display:block;border-radius:10px;">
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="color:#F5F5F5;font-size:20px;font-weight:800;letter-spacing:-0.5px;">CoFound</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Glow accent line -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent 0%,#E91E63 50%,transparent 100%);opacity:0.6;"></div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0;color:#F5F5F5;font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:32px;">
                Restablece tu contraseña
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:8px 32px 24px;">
              <p style="margin:0;color:#A0A0A0;font-size:15px;line-height:23px;">
                Hola <strong style="color:#F5F5F5;font-weight:600;">${firstName}</strong>, usa este código para crear una nueva contraseña en CoFound.
              </p>
            </td>
          </tr>

          <!-- Code box -->
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="background:#0A0A0A;border:1px solid #2A2A2A;border-radius:14px;padding:28px 16px;">
                    <div style="color:#666666;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">
                      Tu código
                    </div>
                    <div style="color:#E91E63;font-size:40px;font-weight:900;letter-spacing:10px;font-family:'SF Mono','Monaco','Menlo','Consolas',monospace;line-height:48px;">
                      ${code}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:top;padding-top:2px;">
                    <span style="color:#E91E63;font-size:14px;">●</span>
                  </td>
                  <td style="padding-left:10px;">
                    <p style="margin:0;color:#F5F5F5;font-size:14px;font-weight:600;line-height:22px;">
                      Caduca en 15 minutos
                    </p>
                    <p style="margin:4px 0 0;color:#A0A0A0;font-size:13px;line-height:20px;">
                      Si no fuiste tú, ignora este email — tu contraseña sigue siendo segura.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:32px 32px 0;">
              <div style="height:1px;background:#2A2A2A;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0 0 6px;color:#A0A0A0;font-size:12px;font-weight:600;line-height:18px;">
                Encuentra al co-founder que te falta.
              </p>
              <p style="margin:0;color:#666666;font-size:11px;line-height:17px;">
                © 2026 CoFound, S.L. · Hecho con café en Madrid
              </p>
            </td>
          </tr>

        </table>

        <!-- Outer footer (hint) -->
        <p style="margin:16px 0 0;color:#444444;font-size:11px;line-height:16px;text-align:center;max-width:480px;">
          Este email se envió porque alguien solicitó restablecer la contraseña de tu cuenta.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`;
