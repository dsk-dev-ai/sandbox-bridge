import type { EmailSendStatus } from "@/lib/demo-alert-template";

export type AlertEmailConfig = {
  configured: boolean;
  apiKey: string;
  from: string;
  to: string;
  apiUrl: string;
  cooldownMs: number;
};

export type SendEmailResult = {
  status: EmailSendStatus;
  id: string;
  error: string;
};

const DEFAULT_FROM = "Proving Ground <onboarding@resend.dev>";
const DEFAULT_API_URL = "https://api.resend.com/emails";
const DEFAULT_COOLDOWN_SECONDS = 180;

function readCooldownMs(): number {
  const raw = Number(process.env.DEMO_ALERT_COOLDOWN_SECONDS);
  if (!Number.isFinite(raw)) return DEFAULT_COOLDOWN_SECONDS * 1000;
  const seconds = Math.min(Math.max(Math.floor(raw), 0), 3600);
  return seconds * 1000;
}

export function getAlertEmailConfig(): AlertEmailConfig {
  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  const to = (process.env.ALERT_TO_EMAIL ?? "").trim();
  const from = (process.env.ALERT_FROM_EMAIL ?? "").trim() || DEFAULT_FROM;
  const apiUrl =
    (process.env.RESEND_API_URL ?? "").trim() || DEFAULT_API_URL;

  return {
    configured: Boolean(apiKey && to),
    apiKey,
    from,
    to,
    apiUrl,
    cooldownMs: readCooldownMs(),
  };
}

type SendEmailInput = {
  config: AlertEmailConfig;
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendAlertEmail({
  config,
  to,
  from,
  subject,
  html,
  text,
}: SendEmailInput): Promise<SendEmailResult> {
  if (!config.apiKey) {
    return {
      status: "skipped",
      id: "",
      error: "RESEND_API_KEY is not configured.",
    };
  }
  if (!to) {
    return {
      status: "skipped",
      id: "",
      error: "ALERT_TO_EMAIL is not configured.",
    };
  }

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "proving-ground/0.1",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const data = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!response.ok) {
      return {
        status: "failed",
        id: "",
        error:
          data?.message ??
          data?.name ??
          `Resend responded with HTTP ${response.status}.`,
      };
    }

    return {
      status: "sent",
      id: typeof data?.id === "string" ? data.id : "",
      error: "",
    };
  } catch (error) {
    return {
      status: "failed",
      id: "",
      error:
        error instanceof Error
          ? `Could not reach Resend: ${error.message}`
          : "Could not reach Resend.",
    };
  }
}
