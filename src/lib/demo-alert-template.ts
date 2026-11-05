export type DemoAlertKind = "down" | "resolved";
export type DemoAlertMode = "healthy" | "broken";
export type EmailSendStatus = "sent" | "skipped" | "failed";
export type DemoAlertEmailStatus = EmailSendStatus | "queued";

export type AlertPreviewRow = {
  label: string;
  value: string;
};

export type AlertPreview = {
  from: string;
  to: string;
  subject: string;
  heading: string;
  intro: string;
  rows: AlertPreviewRow[];
  customerMessage: string;
  nextSteps: string[];
  incidentUrl: string;
  footer: string;
};

export type BuildDemoAlertInput = {
  kind: DemoAlertKind;
  requestId: string;
  statusCode: number;
  errorCode: string | null;
  latencyMs: number | null;
  detectedAt: string;
  recipient: string;
  from: string;
  incidentUrl: string;
};

export type BuiltDemoAlert = {
  subject: string;
  html: string;
  text: string;
  preview: AlertPreview;
};

export type NotifyResponse = {
  status: "sent" | "skipped" | "failed" | "suppressed" | "none";
  kind: DemoAlertKind | null;
  emailStatus: EmailSendStatus | null;
  recipient: string | null;
  subject: string | null;
  preview: AlertPreview | null;
  alertId: string | null;
  createdAt: string | null;
  dedupeRemainingMs: number | null;
  reason: string | null;
  configured: boolean;
};

export type DemoAlertHistoryItem = {
  id: string;
  kind: DemoAlertKind;
  subject: string;
  emailStatus: DemoAlertEmailStatus;
  createdAt: string;
  statusCode: number;
  errorCode: string;
  requestId: string;
};

export type DemoAlertsFeed = {
  configured: boolean;
  recipient: string;
  cooldownSeconds: number;
  openIncident: DemoAlertHistoryItem | null;
  alerts: DemoAlertHistoryItem[];
};

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "not configured";
  const at = trimmed.indexOf("@");
  if (at <= 0) return "configured recipient";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, 1);
  const hidden = "*".repeat(Math.max(2, Math.min(6, local.length - 1)));
  return `${visible}${hidden}@${domain}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildDemoAlert(input: BuildDemoAlertInput): BuiltDemoAlert {
  const isDown = input.kind === "down";
  const statusLabel = `${input.statusCode}${
    input.errorCode ? ` ${input.errorCode}` : ""
  }`;
  const latencyLabel =
    input.latencyMs === null ? "not measured" : `${Math.round(input.latencyMs)}ms`;

  const subject = isDown
    ? `🔴 Proving Ground: checkout API failed with ${input.statusCode}`
    : "🟢 Proving Ground: checkout API recovered";

  const heading = isDown ? "API failure detected" : "API recovered";
  const intro = isDown
    ? "A live checkout just failed against the demo API. Proving Ground opened an incident and paged the developer before a customer had to report it."
    : "The checkout API is healthy again. Proving Ground closed the earlier incident and marked the previous alert as resolved.";

  const customerMessage = isDown
    ? '"Payment could not be completed. Your card was not charged, your cart is saved, and you can try again in a minute."'
    : '"Checkout is working again. You can complete your payment now."';

  const rows: AlertPreviewRow[] = [
    { label: "API", value: "Proving Ground Checkout API" },
    { label: "Endpoint", value: "POST /api/demo/checkout" },
    { label: "Status", value: statusLabel },
    { label: "Request ID", value: input.requestId },
    { label: "Latency", value: latencyLabel },
    { label: "Detected", value: input.detectedAt },
  ];

  const nextSteps = isDown
    ? [
        "Check the payment provider's status page for an outage.",
        `Search logs for request_id ${input.requestId}.`,
        "Confirm the customer was not charged before retrying.",
      ]
    : [
        "No action required — checkout is responding normally.",
        "Review the incident timeline in the alert history.",
      ];

  const footer =
    "Sent by Proving Ground via Resend · You receive this because you own the checkout sandbox.";

  const accent = isDown ? "#b91c1c" : "#047857";
  const accentSoft = isDown ? "#fef2f2" : "#ecfdf5";
  const accentBorder = isDown ? "#fecaca" : "#a7f3d0";

  const rowsHtml = rows
    .map(
      (row) => `<tr>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;color:#64748b;font-size:12px;width:120px;">${escapeHtml(
          row.label
        )}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;color:#0f172a;font-size:12px;">${escapeHtml(
          row.value
        )}</td>
      </tr>`
    )
    .join("");

  const stepsHtml = nextSteps
    .map(
      (step) =>
        `<li style="margin:0 0 6px;color:#334155;font-size:13px;line-height:1.5;">${escapeHtml(
          step
        )}</li>`
    )
    .join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="height:4px;background:${accent};"></div>
      <div style="padding:24px;">
        <p style="margin:0 0 4px;color:${accent};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">Proving Ground alert</p>
        <h1 style="margin:0 0 8px;color:#0f172a;font-size:20px;">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">${escapeHtml(
          intro
        )}</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
          ${rowsHtml}
        </table>
        <div style="padding:12px 14px;background:${accentSoft};border:1px solid ${accentBorder};border-radius:8px;margin:0 0 16px;">
          <p style="margin:0 0 4px;color:${accent};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">What the customer saw</p>
          <p style="margin:0;color:#0f172a;font-size:13px;line-height:1.6;">${escapeHtml(
            customerMessage
          )}</p>
        </div>
        <p style="margin:0 0 6px;color:#0f172a;font-size:13px;font-weight:600;">Next steps</p>
        <ol style="margin:0 0 16px;padding-left:20px;">${stepsHtml}</ol>
        <a href="${escapeHtml(input.incidentUrl)}" style="display:inline-block;margin:0 0 16px;padding:9px 14px;background:#0f172a;color:#ffffff;font-size:12px;text-decoration:none;border-radius:7px;">Open the incident in Proving Ground</a>
        <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5;">${escapeHtml(
          footer
        )}</p>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    `${heading} — Proving Ground`,
    "",
    intro,
    "",
    ...rows.map((row) => `${row.label}: ${row.value}`),
    "",
    `What the customer saw: ${customerMessage}`,
    "",
    "Next steps:",
    ...nextSteps.map((step, index) => `${index + 1}. ${step}`),
    "",
    `Open the incident: ${input.incidentUrl}`,
    "",
    footer,
  ].join("\n");

  return {
    subject,
    html,
    text,
    preview: {
      from: input.from,
      to: maskEmail(input.recipient),
      subject,
      heading,
      intro,
      rows,
      customerMessage,
      nextSteps,
      incidentUrl: input.incidentUrl,
      footer,
    },
  };
}
