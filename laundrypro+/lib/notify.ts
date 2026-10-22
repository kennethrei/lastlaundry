import { Resend } from "resend";
export async function emailAdmin(subject: string, html: string) {
  const key = process.env.RESEND_API_KEY, to = process.env.ADMIN_NOTIFICATION_EMAIL, from = process.env.FROM_EMAIL;
  if (!key || !to || !from) { console.warn("Admin email not configured; dashboard notification remains available."); return; }
  const resend = new Resend(key);
  const result = await resend.emails.send({ from, to, subject, html });
  if (result.error) console.error("Admin email failed", result.error);
}
export async function sendReadySms(phone: string, customer: string, orderNumber: string) {
  const sid=process.env.TWILIO_ACCOUNT_SID, token=process.env.TWILIO_AUTH_TOKEN, from=process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) throw new Error("SMS provider is not configured. Add Twilio credentials before enabling ready-for-pickup SMS.");
  const body = new URLSearchParams({ To: phone, From: from, Body: `Hi ${customer}, your LaundryPro order ${orderNumber} is ready for pickup. Thank you!` });
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { method:"POST", headers:{"Authorization":`Basic ${auth}`,"Content-Type":"application/x-www-form-urlencoded"}, body });
  if (!response.ok) throw new Error(`SMS provider returned ${response.status}`);
}