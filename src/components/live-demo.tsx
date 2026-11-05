"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Code,
  Mail,
  Play,
  Refresh,
  Send,
  Shield,
  X,
} from "@/components/icons";
import type {
  AlertPreview,
  DemoAlertEmailStatus,
  DemoAlertsFeed,
  NotifyResponse,
} from "@/lib/demo-alert-template";
import { cn, timeAgo } from "@/lib/utils";

type Mode = "healthy" | "broken";
type Phase = "idle" | "running" | "success" | "error";

type Message = {
  title: string;
  body: string;
  note?: string;
};

type PanelState = {
  phase: Phase;
  status: number | null;
  latency: number | null;
  requestId: string | null;
  code: string | null;
  message: Message | null;
  raw: string | null;
};

const EMPTY_PANEL: PanelState = {
  phase: "idle",
  status: null,
  latency: null,
  requestId: null,
  code: null,
  message: null,
  raw: null,
};

const INITIAL: Record<Mode, PanelState> = {
  healthy: { ...EMPTY_PANEL },
  broken: { ...EMPTY_PANEL },
};

const MODES: Record<
  Mode,
  {
    caseLabel: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    endpoint: string;
    badge: string;
    dot: string;
    divider: string;
  }
> = {
  healthy: {
    caseLabel: "Case A",
    eyebrow: "API is working",
    title: "When the API works",
    subtitle: "The payment goes through and the customer is told exactly what happens next.",
    endpoint: "mode=healthy",
    badge: "border-mint/30 bg-mint/10 text-mint",
    dot: "bg-mint",
    divider: "from-transparent via-mint/60 to-transparent",
  },
  broken: {
    caseLabel: "Case B",
    eyebrow: "API is broken",
    title: "When the API breaks",
    subtitle: "The provider returns 503. The customer gets a calm, actionable message — and is not charged.",
    endpoint: "mode=broken",
    badge: "border-bad/30 bg-bad/10 text-bad",
    dot: "bg-bad",
    divider: "from-transparent via-bad/60 to-transparent",
  },
};

function messageFor(status: number, code: string | null): Message {
  if (status === 429) {
    return {
      title: "Too many attempts",
      body: "Please wait a moment before trying again. Your card was not charged.",
      note: "The form stays filled in, so the customer can retry without re-entering details.",
    };
  }
  if (status === 401 || status === 403) {
    return {
      title: "Your session expired",
      body: "Sign in again to finish this payment. Nothing was charged.",
      note: "The app keeps the cart and returns the customer to this exact step.",
    };
  }
  if (status >= 400 && status < 500) {
    return {
      title: "Check your payment details",
      body: "The payment was declined before any money moved. Update your details and try again.",
      note: `Technical reason: ${code ?? "validation_error"}`,
    };
  }
  if (status >= 500) {
    return {
      title: "Payment could not be completed",
      body: "We could not reach our payment provider, so your card was not charged. Your cart is saved — please try again in a minute.",
      note: "Nothing was deducted. No order was created. The support team can look up the request ID.",
    };
  }
  return {
    title: "Something went wrong",
    body: "We could not finish the payment. You were not charged. Please try again.",
    note: `Technical reason: ${code ?? "unknown_error"}`,
  };
}

const NETWORK_MESSAGE: Message = {
  title: "You appear to be offline",
  body: "We could not reach the store. Check your connection and try again. You were not charged.",
  note: "The app keeps the cart locally and retries when the connection is back.",
};

const SUCCESS_MESSAGE: Message = {
  title: "Payment complete",
  body: "Your order is confirmed and your receipt is on the way.",
};

const EMAIL_STATUS_TONE: Record<DemoAlertEmailStatus, string> = {
  queued: "border-line2 bg-panel2 text-muted",
  sent: "border-mint/30 bg-mint/10 text-mint",
  skipped: "border-warn/30 bg-warn/10 text-warn",
  failed: "border-bad/30 bg-bad/10 text-bad",
};

const ALERT_TONES = {
  mint: {
    card: "border-mint/30 bg-mint/10",
    icon: "bg-mint/15 text-mint",
    title: "text-mint",
  },
  bad: {
    card: "border-bad/30 bg-bad/10",
    icon: "bg-bad/15 text-bad",
    title: "text-bad",
  },
  warn: {
    card: "border-warn/30 bg-warn/10",
    icon: "bg-warn/15 text-warn",
    title: "text-warn",
  },
  muted: {
    card: "border-line2 bg-panel2/60",
    icon: "bg-line2/60 text-muted",
    title: "text-text",
  },
} as const;

type AlertTone = keyof typeof ALERT_TONES;

function formatRemaining(ms: number): string {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.ceil(seconds / 60)}m`;
}

export function LiveDemo() {
  const [panels, setPanels] = useState<Record<Mode, PanelState>>(INITIAL);
  const [alerts, setAlerts] = useState<Record<Mode, NotifyResponse | null>>({
    healthy: null,
    broken: null,
  });
  const [alertBusy, setAlertBusy] = useState<Record<Mode, boolean>>({
    healthy: false,
    broken: false,
  });
  const [feed, setFeed] = useState<DemoAlertsFeed | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/demo/notify")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: DemoAlertsFeed | null) => {
        if (active && data) setFeed(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function refreshFeed() {
    try {
      const response = await fetch("/api/demo/notify");
      if (!response.ok) return;
      const data = (await response.json()) as DemoAlertsFeed;
      setFeed(data);
    } catch {
      // The feed is a convenience; the delivery result is already on screen.
    }
  }

  async function notify(
    mode: Mode,
    details: {
      request_id: string | null;
      status: number;
      error_code: string | null;
      latency_ms: number | null;
    }
  ) {
    setAlertBusy((current) => ({ ...current, [mode]: true }));
    try {
      const response = await fetch("/api/demo/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode === "healthy" ? "healthy" : "broken",
          ...details,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | NotifyResponse
        | null;
      if (result) {
        setAlerts((current) => {
          const next = { ...current, [mode]: result };
          if (
            result.kind === "resolved" &&
            result.status !== "none"
          ) {
            next.broken = null;
          }
          return next;
        });
      }
    } catch {
      setAlerts((current) => ({
        ...current,
        [mode]: {
          status: "failed",
          kind: mode === "broken" ? "down" : "resolved",
          emailStatus: null,
          recipient: null,
          subject: null,
          preview: null,
          alertId: null,
          createdAt: null,
          dedupeRemainingMs: null,
          reason: "Could not reach the alert pipeline.",
          configured: false,
        },
      }));
    } finally {
      setAlertBusy((current) => ({ ...current, [mode]: false }));
      void refreshFeed();
    }
  }

  async function run(mode: Mode) {
    setPanels((current) => ({
      ...current,
      [mode]: { ...current[mode], phase: "running", message: null, raw: null },
    }));

    const started = performance.now();
    try {
      const response = await fetch("/api/demo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const latency = Math.round(performance.now() - started);
      const data = await response.json().catch(() => ({}));
      const requestId =
        response.headers.get("x-request-id") ??
        (typeof data?.request_id === "string" ? data.request_id : null);
      const status = response.status;
      const raw = JSON.stringify(
        {
          request: { method: "POST", path: "/api/demo/checkout", mode },
          response: { status, body: data },
        },
        null,
        2
      );

      if (response.ok) {
        const amount =
          typeof data?.amount === "number"
            ? `$${(data.amount / 100).toFixed(2)}`
            : "";
        setPanels((current) => ({
          ...current,
          [mode]: {
            phase: "success",
            status,
            latency,
            requestId,
            code: null,
            message: {
              ...SUCCESS_MESSAGE,
              note: [data?.order_id, amount].filter(Boolean).join(" · "),
            },
            raw,
          },
        }));
        void notify("healthy", {
          request_id: requestId,
          status,
          error_code: null,
          latency_ms: latency,
        });
        return;
      }

      const code =
        typeof data?.error?.code === "string" ? data.error.code : null;
      setPanels((current) => ({
        ...current,
        [mode]: {
          phase: "error",
          status,
          latency,
          requestId,
          code,
          message: messageFor(status, code),
          raw,
        },
      }));
      void notify("broken", {
        request_id: requestId,
        status,
        error_code: code,
        latency_ms: latency,
      });
    } catch {
      setPanels((current) => ({
        ...current,
        [mode]: {
          phase: "error",
          status: null,
          latency: null,
          requestId: null,
          code: "NETWORK_ERROR",
          message: NETWORK_MESSAGE,
          raw: null,
        },
      }));
    }
  }

  function runBoth() {
    void run("healthy");
    void run("broken");
  }

  function reset() {
    setPanels({ healthy: { ...EMPTY_PANEL }, broken: { ...EMPTY_PANEL } });
    setAlerts({ healthy: null, broken: null });
  }

  const anyRunning =
    panels.healthy.phase === "running" || panels.broken.phase === "running";
  const hasResult =
    panels.healthy.phase !== "idle" || panels.broken.phase !== "idle";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runBoth}
          disabled={anyRunning}
          className="btn-primary"
        >
          <Play className="h-4 w-4" />
          {anyRunning ? "Running both cases…" : "Run both cases"}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={!hasResult || anyRunning}
          className="btn-ghost"
        >
          <Refresh className="h-4 w-4" />
          Reset
        </button>
        <p className="text-xs text-faint">
          Both buttons call the same live endpoint. The broken case also runs the
          Resend alert pipeline and opens an incident.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <DemoPanel
          mode="healthy"
          state={panels.healthy}
          alert={alerts.healthy}
          alertBusy={alertBusy.healthy}
          onRun={() => run("healthy")}
        />
        <DemoPanel
          mode="broken"
          state={panels.broken}
          alert={alerts.broken}
          alertBusy={alertBusy.broken}
          onRun={() => run("broken")}
        />
      </div>

      <AlertHistory feed={feed} />
    </div>
  );
}

function DemoPanel({
  mode,
  state,
  alert,
  alertBusy,
  onRun,
}: {
  mode: Mode;
  state: PanelState;
  alert: NotifyResponse | null;
  alertBusy: boolean;
  onRun: () => void;
}) {
  const meta = MODES[mode];
  const running = state.phase === "running";
  const result = state.message;

  return (
    <article
      className={cn(
        "card overflow-hidden",
        mode === "broken" ? "border-bad/20" : "border-mint/20"
      )}
    >
      <div className={cn("h-0.5 w-full bg-gradient-to-r", meta.divider)} />
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              meta.badge
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.eyebrow}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-faint">
            {meta.caseLabel}
          </span>
        </div>

        <h2 className="mt-4 text-lg font-semibold tracking-tight text-text">
          {meta.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {meta.subtitle}
        </p>
        <p className="mt-3 font-mono text-[10px] text-faint">
          POST /api/demo/checkout · {meta.endpoint}
        </p>

        {/* Customer app window */}
        <div className="mt-5 rounded-xl border border-line bg-ink/50">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-bad/50" />
            <span className="h-2 w-2 rounded-full bg-warn/50" />
            <span className="h-2 w-2 rounded-full bg-mint/50" />
            <span className="ml-2 font-mono text-[10px] text-faint">
              store.provingground.dev/checkout
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-faint">
                  Order #1042
                </p>
                <p className="mt-1 text-sm font-medium text-text">
                  Proving Ground Pro
                </p>
                <p className="text-xs text-faint">
                  Annual plan · renews automatically
                </p>
              </div>
              <p className="text-xl font-semibold tracking-tight text-text">
                $49.99
              </p>
            </div>

            <button
              type="button"
              onClick={onRun}
              disabled={running}
              className="btn-primary mt-4 w-full"
            >
              {running ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                  Processing payment…
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Pay $49.99
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[10px] text-faint">
              Sandbox checkout · no real card is ever charged
            </p>
          </div>
        </div>

        {/* User-facing message */}
        <div className="mt-4">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-faint">
            Message shown to the customer
          </p>

          {state.phase === "idle" ? (
            <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-xs text-faint">
              Run this case to see the exact user-facing message.
            </div>
          ) : null}

          {running ? (
            <div className="rounded-xl border border-line bg-panel2/50 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-line2 border-t-mint" />
                <div className="flex-1 space-y-2">
                  <div className="h-2 w-1/2 animate-pulse rounded bg-line2" />
                  <div className="h-2 w-3/4 animate-pulse rounded bg-line" />
                </div>
              </div>
            </div>
          ) : null}

          {result && (state.phase === "success" || state.phase === "error") ? (
            <div
              className={cn(
                "fade-up rounded-xl border p-4",
                state.phase === "success"
                  ? "border-mint/30 bg-mint/10"
                  : "border-bad/30 bg-bad/10"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                    state.phase === "success"
                      ? "bg-mint/20 text-mint"
                      : "bg-bad/20 text-bad"
                  )}
                >
                  {state.phase === "success" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Alert className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      state.phase === "success" ? "text-mint" : "text-bad"
                    )}
                  >
                    {result.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-text/85">
                    {result.body}
                  </p>
                  {result.note ? (
                    <p
                      className={cn(
                        "mt-2 text-[11px]",
                        state.phase === "success" ? "text-mint/80" : "text-warn"
                      )}
                    >
                      {result.note}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 pt-2.5 text-[10px] text-faint">
                {state.status !== null ? (
                  <span
                    className={cn(
                      "font-mono",
                      state.phase === "success" ? "text-mint" : "text-bad"
                    )}
                  >
                    HTTP {state.status}
                  </span>
                ) : (
                  <span className="font-mono text-bad">NO RESPONSE</span>
                )}
                {state.latency !== null ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {state.latency}ms
                  </span>
                ) : null}
                {state.requestId ? (
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Shield className="h-3 w-3" />
                    support: {state.requestId}
                  </span>
                ) : null}
                {state.code ? (
                  <span className="font-mono">{state.code}</span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Developer alert via Resend */}
        {(alert || alertBusy) &&
        (state.phase === "success" || state.phase === "error") ? (
          <AlertDeliveryCard mode={mode} state={alert} busy={alertBusy} />
        ) : null}

        {/* Technical view */}
        {state.raw ? (
          <details className="group mt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-line bg-ink/40 px-3 py-2.5 text-[10px] uppercase tracking-wider text-faint [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <Code className="h-3.5 w-3.5" />
                What the integration sees
              </span>
              <span className="inline-flex items-center gap-1">
                {state.phase === "success" ? (
                  <Check className="h-3 w-3 text-mint" />
                ) : (
                  <X className="h-3 w-3 text-bad" />
                )}
                {state.phase === "success" ? "handled" : "caught"}
              </span>
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-line bg-panel p-3 font-mono text-[10px] leading-relaxed text-muted">
              {state.raw}
            </pre>
          </details>
        ) : null}
      </div>
    </article>
  );
}

function AlertDeliveryCard({
  mode,
  state,
  busy,
}: {
  mode: Mode;
  state: NotifyResponse | null;
  busy: boolean;
}) {
  if (busy || !state) {
    return (
      <div className="mt-4 rounded-xl border border-line bg-panel2/40 p-4">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line2 border-t-sky" />
          <div className="flex-1 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-faint">
              Developer alert pipeline
            </p>
            <div className="h-2 w-2/3 animate-pulse rounded bg-line2" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-line" />
          </div>
        </div>
      </div>
    );
  }

  const isResolved =
    (state.kind ?? (mode === "broken" ? "down" : "resolved")) === "resolved";

  let tone: AlertTone = "muted";
  let title = "";
  let body = "";

  switch (state.status) {
    case "sent":
      tone = isResolved ? "mint" : "bad";
      title = isResolved
        ? "Recovery email sent via Resend"
        : "Developer paged via Resend";
      body = `Delivered to ${state.recipient ?? "the configured recipient"}${
        state.createdAt ? ` · ${timeAgo(state.createdAt)}` : ""
      }.`;
      break;
    case "skipped":
      tone = "warn";
      title = isResolved
        ? "Recovery recorded — email skipped"
        : "Incident recorded — email skipped";
      body = `${
        state.reason ?? "Resend is not configured."
      } Add RESEND_API_KEY and ALERT_TO_EMAIL to send real mail.`;
      break;
    case "failed":
      tone = "bad";
      title = "Resend could not deliver the alert";
      body =
        state.reason ??
        "The alert is stored in the log, but the email did not send.";
      break;
    case "suppressed":
      tone = "warn";
      title = "Duplicate alert suppressed";
      body = `${
        state.reason ?? "This incident already alerted the developer."
      }${
        state.dedupeRemainingMs
          ? ` Window closes in ${formatRemaining(state.dedupeRemainingMs)}.`
          : ""
      }`;
      break;
    case "none":
      tone = "muted";
      title = "No open incident";
      body = state.reason ?? "Nothing to recover. Run the broken case first.";
      break;
  }

  const palette = ALERT_TONES[tone];

  return (
    <div className={cn("fade-up mt-4 rounded-xl border p-4", palette.card)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full",
            palette.icon
          )}
        >
          {isResolved ? (
            <Check className="h-4 w-4" />
          ) : state.status === "suppressed" || state.status === "none" ? (
            <Bell className="h-4 w-4" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("text-sm font-semibold", palette.title)}>{title}</p>
            {state.emailStatus ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider",
                  EMAIL_STATUS_TONE[state.emailStatus]
                )}
              >
                {state.emailStatus}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-text/80">{body}</p>
          <p className="mt-2 font-mono text-[10px] text-faint">
            detect → Resend → fix → recovery
          </p>
        </div>
      </div>

      {state.preview ? (
        <details className="group mt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-line bg-ink/40 px-3 py-2 text-[10px] uppercase tracking-wider text-faint [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              Preview the email
            </span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          </summary>
          <EmailPreview preview={state.preview} isResolved={isResolved} />
        </details>
      ) : null}
    </div>
  );
}

function EmailPreview({
  preview,
  isResolved,
}: {
  preview: AlertPreview;
  isResolved: boolean;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-[#dbe2ea] bg-white text-[#0f172a]">
      <div className="border-b border-[#e2e8f0] px-4 py-3">
        <p className="text-[11px] font-semibold text-[#0f172a]">
          {preview.from}
        </p>
        <p className="mt-0.5 text-[11px] text-[#64748b]">
          to {preview.to}
        </p>
        <p className="mt-2 text-[12px] font-medium">{preview.subject}</p>
      </div>
      <div className="px-4 py-4">
        <p
          className={cn(
            "text-[10px] uppercase tracking-wider",
            isResolved ? "text-[#047857]" : "text-[#b91c1c]"
          )}
        >
          {preview.heading}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#475569]">
          {preview.intro}
        </p>

        <div className="mt-3 overflow-hidden rounded-md border border-[#e2e8f0]">
          {preview.rows.map((row, index) => (
            <div
              key={row.label}
              className={cn(
                "flex gap-2 px-2.5 py-1.5 text-[11px]",
                index > 0 && "border-t border-[#e2e8f0]"
              )}
            >
              <span className="w-20 shrink-0 text-[#64748b]">{row.label}</span>
              <span className="break-all font-mono text-[10.5px] text-[#0f172a]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "mt-3 rounded-md border px-3 py-2",
            isResolved
              ? "border-[#a7f3d0] bg-[#ecfdf5]"
              : "border-[#fecaca] bg-[#fef2f2]"
          )}
        >
          <p
            className={cn(
              "text-[9px] uppercase tracking-wider",
              isResolved ? "text-[#047857]" : "text-[#b91c1c]"
            )}
          >
            What the customer saw
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#0f172a]">
            {preview.customerMessage}
          </p>
        </div>

        <p className="mt-3 text-[11px] font-semibold">Next steps</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-[#475569]">
          {preview.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <a
          href={preview.incidentUrl}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#0f172a] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#1e293b]"
        >
          Open the incident
          <ChevronRight className="h-3 w-3" />
        </a>

        <p className="mt-3 border-t border-[#e2e8f0] pt-2 text-[10px] leading-relaxed text-[#94a3b8]">
          {preview.footer}
        </p>
      </div>
    </div>
  );
}

function AlertHistory({ feed }: { feed: DemoAlertsFeed | null }) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            <Send className="h-3 w-3" />
            Resend delivery log
          </p>
          <h3 className="mt-1 text-sm font-semibold text-text">
            Alerts emailed to the developer
          </h3>
        </div>
        {feed ? (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px]",
              feed.configured
                ? "border-mint/30 bg-mint/10 text-mint"
                : "border-warn/30 bg-warn/10 text-warn"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                feed.configured ? "dot-pulse bg-mint" : "bg-warn"
              )}
            />
            {feed.configured
              ? `Resend connected · ${feed.recipient}`
              : "Resend not configured"}
          </span>
        ) : null}
      </div>

      {feed && !feed.configured ? (
        <p className="mt-3 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[11px] leading-relaxed text-warn">
          Set RESEND_API_KEY and ALERT_TO_EMAIL to deliver real mail. Until then
          every alert is recorded and previewed, but delivery is skipped.
        </p>
      ) : null}

      {feed?.openIncident ? (
        <p className="mt-3 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-[11px] leading-relaxed text-text/85">
          Incident open since {timeAgo(feed.openIncident.createdAt)}. Run the
          healthy case to send the recovery email.
        </p>
      ) : null}

      <div className="card mt-3 divide-y divide-line overflow-hidden">
        {!feed ? (
          <p className="px-4 py-6 text-center text-xs text-faint">
            Loading alert history…
          </p>
        ) : feed.alerts.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-faint">
            No alerts yet. Run the broken case.
          </p>
        ) : (
          feed.alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                  alert.kind === "down"
                    ? "bg-bad/15 text-bad"
                    : "bg-mint/15 text-mint"
                )}
              >
                {alert.kind === "down" ? (
                  <Bell className="h-3.5 w-3.5" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-text">
                  {alert.subject}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-faint">
                  HTTP {alert.statusCode} · {alert.requestId} ·{" "}
                  {timeAgo(alert.createdAt)}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider",
                  EMAIL_STATUS_TONE[alert.emailStatus]
                )}
              >
                {alert.emailStatus}
              </span>
            </div>
          ))
        )}
      </div>
      <p className="mt-2 text-[10px] text-faint">
        Duplicate guard:{" "}
        {feed
          ? feed.cooldownSeconds === 0
            ? "disabled"
            : `${feed.cooldownSeconds}s per incident`
          : "loading"}{" "}
        · last 6 deliveries
      </p>
    </section>
  );
}
