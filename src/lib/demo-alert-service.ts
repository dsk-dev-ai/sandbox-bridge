import {
  buildDemoAlert,
  maskEmail,
  type DemoAlertMode,
  type DemoAlertsFeed,
  type NotifyResponse,
} from "@/lib/demo-alert-template";
import {
  getLatestDownAlert,
  getOpenIncident,
  getRecentDemoAlerts,
  insertDemoAlert,
  pruneDemoAlerts,
  resolveOpenIncidents,
  toHistoryItem,
  updateDemoAlertEmail,
} from "@/lib/demo-alert-store";
import { getAlertEmailConfig, sendAlertEmail } from "@/lib/resend";

export type NotifyDemoInput = {
  mode: DemoAlertMode;
  requestId: string;
  statusCode: number;
  errorCode: string | null;
  latencyMs: number | null;
  incidentUrl: string;
};

function newAlertId(): string {
  return `alert_${crypto.randomUUID().slice(0, 8)}`;
}

export async function notifyDemo(
  input: NotifyDemoInput
): Promise<NotifyResponse> {
  const config = getAlertEmailConfig();
  const now = new Date().toISOString();

  if (input.mode === "healthy") {
    const open = getOpenIncident();
    if (!open) {
      return {
        status: "none",
        kind: null,
        emailStatus: null,
        recipient: config.configured ? maskEmail(config.to) : null,
        subject: null,
        preview: null,
        alertId: null,
        createdAt: null,
        dedupeRemainingMs: null,
        reason: "No open incident. Run the broken case first to open one.",
        configured: config.configured,
      };
    }

    const built = buildDemoAlert({
      kind: "resolved",
      requestId: input.requestId,
      statusCode: input.statusCode,
      errorCode: null,
      latencyMs: input.latencyMs,
      detectedAt: now,
      recipient: config.to,
      from: config.from,
      incidentUrl: input.incidentUrl,
    });

    const id = newAlertId();
    const record = insertDemoAlert({
      id,
      kind: "resolved",
      mode: "checkout",
      statusCode: input.statusCode,
      errorCode: "",
      requestId: input.requestId,
      recipient: config.to,
      fromEmail: config.from,
      subject: built.subject,
      createdAt: now,
    });
    resolveOpenIncidents(now);

    const send = await sendAlertEmail({
      config,
      to: config.to,
      from: config.from,
      subject: built.subject,
      html: built.html,
      text: built.text,
    });
    updateDemoAlertEmail(record.id, send.status, send.error, send.id);
    pruneDemoAlerts();

    return {
      status: send.status,
      kind: "resolved",
      emailStatus: send.status,
      recipient: config.configured ? maskEmail(config.to) : null,
      subject: built.subject,
      preview: built.preview,
      alertId: record.id,
      createdAt: now,
      dedupeRemainingMs: null,
      reason: send.error || null,
      configured: config.configured,
    };
  }

  const latest = getLatestDownAlert();
  const dedupeRemainingMs =
    latest && !latest.resolvedAt
      ? new Date(latest.createdAt).getTime() + config.cooldownMs - Date.now()
      : 0;

  if (latest && !latest.resolvedAt && dedupeRemainingMs > 0) {
    const built = buildDemoAlert({
      kind: "down",
      requestId: latest.requestId,
      statusCode: latest.statusCode,
      errorCode: latest.errorCode || null,
      latencyMs: null,
      detectedAt: latest.createdAt,
      recipient: config.to,
      from: config.from,
      incidentUrl: input.incidentUrl,
    });

    return {
      status: "suppressed",
      kind: "down",
      emailStatus:
        latest.emailStatus === "queued" ? null : latest.emailStatus,
      recipient: config.configured ? maskEmail(config.to) : null,
      subject: latest.subject,
      preview: built.preview,
      alertId: latest.id,
      createdAt: latest.createdAt,
      dedupeRemainingMs,
      reason:
        "This incident already paged the developer. Duplicate alerts are suppressed to protect the on-call engineer.",
      configured: config.configured,
    };
  }

  const built = buildDemoAlert({
    kind: "down",
    requestId: input.requestId,
    statusCode: input.statusCode,
    errorCode: input.errorCode,
    latencyMs: input.latencyMs,
    detectedAt: now,
    recipient: config.to,
    from: config.from,
    incidentUrl: input.incidentUrl,
  });

  const id = newAlertId();
  const record = insertDemoAlert({
    id,
    kind: "down",
    mode: "checkout",
    statusCode: input.statusCode,
    errorCode: input.errorCode ?? "",
    requestId: input.requestId,
    recipient: config.to,
    fromEmail: config.from,
    subject: built.subject,
    createdAt: now,
  });

  const send = await sendAlertEmail({
    config,
    to: config.to,
    from: config.from,
    subject: built.subject,
    html: built.html,
    text: built.text,
  });
  updateDemoAlertEmail(record.id, send.status, send.error, send.id);
  pruneDemoAlerts();

  return {
    status: send.status,
    kind: "down",
    emailStatus: send.status,
    recipient: config.configured ? maskEmail(config.to) : null,
    subject: built.subject,
    preview: built.preview,
    alertId: record.id,
    createdAt: now,
    dedupeRemainingMs: null,
    reason: send.error || null,
    configured: config.configured,
  };
}

export function getDemoAlertFeed(): DemoAlertsFeed {
  const config = getAlertEmailConfig();
  const open = getOpenIncident();
  return {
    configured: config.configured,
    recipient: maskEmail(config.to),
    cooldownSeconds: Math.round(config.cooldownMs / 1000),
    openIncident: open ? toHistoryItem(open) : null,
    alerts: getRecentDemoAlerts(6).map(toHistoryItem),
  };
}
