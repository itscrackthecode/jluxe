import 'server-only';

import { Resend } from 'resend';

const notificationRecipient = 'enquiry@thejluxe.com';

type NotificationEmail = {
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendJluxeNotification(email: NotificationEmail) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    throw new Error('EmailConfigurationError');
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: notificationRecipient,
    ...(email.replyTo ? { replyTo: email.replyTo } : {}),
    subject: email.subject,
    text: email.text,
    ...(email.html ? { html: email.html } : {}),
  });

  if (result.error) {
    throw new Error('ResendError');
  }
}
