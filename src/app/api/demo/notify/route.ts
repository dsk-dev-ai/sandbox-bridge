import { NextResponse } from "next/server";
import { asNumber, asString, readJson } from "@/lib/http";
import { getDemoAlertFeed, notifyDemo } from "@/lib/demo-alert-service";

export const dynamic = "force-dynamic";

function sanitizeRequestId(value: unknown): string {
  const raw = asString(value).slice(0, 64);
  return /^req_[A-Za-z0-9_-]{4,60}$/.test(raw)
    ? raw
    : `req_${crypto.randomUUID().slice(0, 8)}`;
}

function sanitizeErrorCode(value: unknown): string {
  const raw = asString(value).slice(0, 64);
  return /^[A-Z][A-Z0-9_]{2,63}$/.test(raw)
    ? raw
    : "PAYMENT_PROVIDER_UNAVAILABLE";
}

function sanitizeLatency(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const raw = asNumber(value, -1);
  if (!Number.isFinite(raw) || raw < 0) return null;
  return Math.min(Math.round(raw), 60_000);
}

function resolveBaseUrl(request: Request): string {
  const configured = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(configured)) return configured;

  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto === "https" || url.protocol === "https:" ? "https" : "http";
  return `${proto}://${host}`;
}

export async function GET() {
  return NextResponse.json(getDemoAlertFeed());
}

export async function POST(request: Request) {
  const body = (await readJson(request)) ?? {};
  const mode = asString(body.mode) === "healthy" ? "healthy" : "broken";

  const statusCode =
    mode === "healthy"
      ? 200
      : Math.min(Math.max(Math.round(asNumber(body.status, 503)), 400), 599);

  const result = await notifyDemo({
    mode,
    requestId: sanitizeRequestId(body.request_id),
    statusCode,
    errorCode:
      mode === "healthy" ? null : sanitizeErrorCode(body.error_code),
    latencyMs: sanitizeLatency(body.latency_ms),
    incidentUrl: `${resolveBaseUrl(request)}/demo`,
  });

  return NextResponse.json(result);
}
