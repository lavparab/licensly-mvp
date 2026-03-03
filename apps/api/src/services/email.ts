import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock123'); // Fallback for MVP local dev

interface EmailParams {
    to: string | string[];
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
        return { success: true, mocked: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Licensly Alerts <alerts@licensly.dev>', // In real world this domain must be verified
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}

export async function sendComplianceAlertEmail(to: string, severity: string, message: string) {
    const color = severity === 'critical' ? '#dc2626' : '#d97706';

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: ${color};">🚨 Licensly Compliance Alert</h2>
      <p style="font-size: 16px; color: #374151;">A new <strong>${severity.toUpperCase()}</strong> alert requires your attention:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid ${color}; margin: 20px 0;">
        <p style="margin: 0; font-size: 15px;">${message}</p>
      </div>
      <p style="font-size: 14px; color: #6b7280;">Log in to your Licensly dashboard to review and resolve this issue.</p>
      <a href="http://localhost:5173/compliance" style="display: inline-block; background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Go to Dashboard</a>
    </div>
  `;

    return sendEmail({ to, subject: `Licensly ${severity.toUpperCase()} Alert`, html });
}
