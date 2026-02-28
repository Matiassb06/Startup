"""
email_service.py — Servicio de envío de correos para Train-to-Hire.

Soporta:
  - SMTP real (producción): configurar SMTP_* en .env
  - Modo consola (desarrollo): imprime el correo en stdout si SMTP_HOST no está configurado.

Uso:
  from email_service import send_verification_email
  send_verification_email("user@email.com", "abc123token")
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("traintohire.email")

# ── Configuración SMTP desde variables de entorno ──
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@traintohire.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _send_email(to: str, subject: str, html_body: str) -> bool:
    """
    Envía un correo. Si SMTP_HOST no está configurado, imprime a consola (dev mode).
    Retorna True si se envió (o imprimió) con éxito.
    """
    if not SMTP_HOST:
        logger.info("── EMAIL (modo consola — SMTP_HOST no configurado) ──")
        logger.info(f"  Para: {to}")
        logger.info(f"  Asunto: {subject}")
        logger.info(f"  Cuerpo:\n{html_body[:500]}")
        logger.info("── FIN EMAIL ──")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to, msg.as_string())

        logger.info(f"Email enviado a {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Error enviando email a {to}: {e}")
        return False


def send_verification_email(to: str, token: str) -> bool:
    """Envía el correo de verificación con el link."""
    verify_url = f"{FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #7c3aed;">Train-to-Hire</h2>
      <p>¡Gracias por registrarte! Verifica tu correo haciendo clic en el botón:</p>
      <a href="{verify_url}"
         style="display: inline-block; background: #7c3aed; color: white; padding: 12px 28px;
                border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
        Verificar mi correo
      </a>
      <p style="color: #888; font-size: 13px;">
        O copia este enlace en tu navegador:<br/>
        <a href="{verify_url}">{verify_url}</a>
      </p>
      <p style="color: #888; font-size: 12px;">Si no creaste esta cuenta, ignora este correo.</p>
    </div>
    """
    return _send_email(to, "Verifica tu correo — Train-to-Hire", html)
