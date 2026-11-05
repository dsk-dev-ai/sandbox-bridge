import { getDb } from "@/lib/db";
import type {
  DemoAlertEmailStatus,
  DemoAlertHistoryItem,
  DemoAlertKind,
} from "@/lib/demo-alert-template";

type Row = Record<string, unknown>;

const text = (value: unknown): string =>
  typeof value === "string" ? value : String(value ?? "");
const number = (value: unknown): number =>
  typeof value === "number" ? value : Number(value ?? 0);

export type DemoAlertRecord = {
  id: string;
  kind: DemoAlertKind;
  mode: string;
  statusCode: number;
  errorCode: string;
  requestId: string;
  recipient: string;
  fromEmail: string;
  subject: string;
  emailStatus: DemoAlertEmailStatus;
  emailError: string;
  emailId: string;
  createdAt: string;
  resolvedAt: string | null;
};

function rowToAlert(row: Row): DemoAlertRecord {
  return {
    id: text(row.id),
    kind: text(row.kind) as DemoAlertKind,
    mode: text(row.mode),
    statusCode: number(row.status_code),
    errorCode: text(row.error_code),
    requestId: text(row.request_id),
    recipient: text(row.recipient),
    fromEmail: text(row.from_email),
    subject: text(row.subject),
    emailStatus: text(row.email_status) as DemoAlertEmailStatus,
    emailError: text(row.email_error),
    emailId: text(row.email_id),
    createdAt: text(row.created_at),
    resolvedAt: row.resolved_at === null ? null : text(row.resolved_at),
  };
}

export function toHistoryItem(alert: DemoAlertRecord): DemoAlertHistoryItem {
  return {
    id: alert.id,
    kind: alert.kind,
    subject: alert.subject,
    emailStatus: alert.emailStatus,
    createdAt: alert.createdAt,
    statusCode: alert.statusCode,
    errorCode: alert.errorCode,
    requestId: alert.requestId,
  };
}

export type InsertDemoAlertInput = {
  id: string;
  kind: DemoAlertKind;
  mode: string;
  statusCode: number;
  errorCode: string;
  requestId: string;
  recipient: string;
  fromEmail: string;
  subject: string;
  createdAt: string;
};

export function insertDemoAlert(input: InsertDemoAlertInput): DemoAlertRecord {
  const db = getDb();
  db.prepare(
    `INSERT INTO demo_alerts
      (id, kind, mode, status_code, error_code, request_id, recipient, from_email, subject, email_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?)`
  ).run(
    input.id,
    input.kind,
    input.mode,
    input.statusCode,
    input.errorCode,
    input.requestId,
    input.recipient,
    input.fromEmail,
    input.subject,
    input.createdAt
  );

  const row = db
    .prepare("SELECT * FROM demo_alerts WHERE id = ?")
    .get(input.id) as Row | undefined;
  return rowToAlert(row ?? {});
}

export function updateDemoAlertEmail(
  id: string,
  emailStatus: DemoAlertEmailStatus,
  emailError: string,
  emailId: string
): void {
  getDb()
    .prepare(
      "UPDATE demo_alerts SET email_status = ?, email_error = ?, email_id = ? WHERE id = ?"
    )
    .run(emailStatus, emailError, emailId, id);
}

export function getOpenIncident(): DemoAlertRecord | null {
  const row = getDb()
    .prepare(
      "SELECT * FROM demo_alerts WHERE kind = 'down' AND resolved_at IS NULL ORDER BY created_at DESC LIMIT 1"
    )
    .get() as Row | undefined;
  return row ? rowToAlert(row) : null;
}

export function getLatestDownAlert(): DemoAlertRecord | null {
  const row = getDb()
    .prepare(
      "SELECT * FROM demo_alerts WHERE kind = 'down' ORDER BY created_at DESC LIMIT 1"
    )
    .get() as Row | undefined;
  return row ? rowToAlert(row) : null;
}

export function resolveOpenIncidents(resolvedAt: string): void {
  getDb()
    .prepare(
      "UPDATE demo_alerts SET resolved_at = ? WHERE kind = 'down' AND resolved_at IS NULL"
    )
    .run(resolvedAt);
}

export function getRecentDemoAlerts(limit = 6): DemoAlertRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM demo_alerts ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Row[];
  return rows.map(rowToAlert);
}

export function pruneDemoAlerts(keep = 100): void {
  getDb()
    .prepare(
      `DELETE FROM demo_alerts
       WHERE id NOT IN (SELECT id FROM demo_alerts ORDER BY created_at DESC LIMIT ?)`
    )
    .run(keep);
}
