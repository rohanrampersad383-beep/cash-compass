type AuthMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  actionUrl: string;
  type: "password-reset" | "email-verification";
};

function appUrl() {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}
export function authActionUrl(path: string, token: string) {
  const url = new URL(path, appUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendAuthMail(input: AuthMailInput) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!resendApiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[Cash Compass dev email:${input.type}] ${input.actionUrl}`);
      return { ok: true, delivered: false, devFallback: true };
    }

    console.warn(`Cash Compass email provider is not configured for ${input.type}.`);
    return { ok: false, delivered: false, devFallback: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      console.warn(`Cash Compass email provider rejected ${input.type} email.`);
      return { ok: false, delivered: false, devFallback: false };
    }

    return { ok: true, delivered: true, devFallback: false };
  } catch {
    console.warn(`Cash Compass could not send ${input.type} email.`);
    return { ok: false, delivered: false, devFallback: false };
  }
}
