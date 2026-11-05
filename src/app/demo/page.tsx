import Link from "next/link";
import type { Metadata } from "next";
import { LiveDemo } from "@/components/live-demo";
import {
  Activity,
  ArrowRight,
  Check,
  Clock,
  Code,
  Mail,
  Shield,
  Users,
  Zap,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Live demo · working vs broken API",
  description:
    "Run a real checkout call against a healthy API and a broken API. See exactly what the customer is told in each case.",
};

const MESSAGES = [
  {
    status: "HTTP 200",
    tone: "border-mint/30 bg-mint/10 text-mint",
    user: "Payment complete",
    detail: "Order confirmed, receipt on the way.",
    money: "Charged once",
  },
  {
    status: "HTTP 4xx",
    tone: "border-warn/30 bg-warn/10 text-warn",
    user: "Check your payment details",
    detail: "Actionable decline, no jargon, cart preserved.",
    money: "Not charged",
  },
  {
    status: "HTTP 429",
    tone: "border-warn/30 bg-warn/10 text-warn",
    user: "Too many attempts",
    detail: "Ask the customer to wait a moment.",
    money: "Not charged",
  },
  {
    status: "HTTP 5xx",
    tone: "border-bad/30 bg-bad/10 text-bad",
    user: "Payment could not be completed",
    detail: "Reassure, keep the cart, expose a support code.",
    money: "Not charged",
  },
  {
    status: "No response",
    tone: "border-line2 bg-panel2 text-muted",
    user: "You appear to be offline",
    detail: "Retry when the connection returns.",
    money: "Not charged",
  },
];

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
          Live demo · two cases
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Watch the same payment succeed — and fail — in real time
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          Both panels below are the same customer app calling the same live
          endpoint in this repository. In case A the API is healthy. In case B the
          payment provider is down and Proving Ground emails the developer through
          Resend. The customer never sees a stack trace — but the developer gets the
          request ID, status, latency, and the exact customer-facing message.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/catalog" className="btn-ghost px-3 py-2 text-xs">
            Browse full sandboxes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <a
            href="/api/demo/checkout?mode=healthy"
            target="_blank"
            rel="noreferrer"
            className="btn-subtle px-3 py-2 text-xs font-mono"
          >
            /api/demo/checkout?mode=healthy
          </a>
          <a
            href="/api/demo/checkout?mode=broken"
            target="_blank"
            rel="noreferrer"
            className="btn-subtle px-3 py-2 text-xs font-mono text-bad"
          >
            ?mode=broken
          </a>
        </div>
      </div>

      <div className="mt-10">
        <LiveDemo />
      </div>

      {/* Alert loop */}
      <section className="mt-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
            The alert loop
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
            Detect, email, fix, confirm
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This is the same loop an uptime monitor runs in production. The demo
            calls it live so a buyer can see the whole incident — not a slide
            describing it.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            {
              icon: <Activity className="h-4 w-4 text-bad" />,
              step: "01",
              title: "Detect",
              body: "The check sees a 503 or a timeout, records the request ID and latency, and opens an incident.",
            },
            {
              icon: <Mail className="h-4 w-4 text-sky" />,
              step: "02",
              title: "Email via Resend",
              body: "Resend delivers the alert to the developer with the status, request ID, and what the customer saw.",
            },
            {
              icon: <Code className="h-4 w-4 text-warn" />,
              step: "03",
              title: "Fix with evidence",
              body: "The developer reproduces the failure from the request ID and error code, then patches the provider call.",
            },
            {
              icon: <Check className="h-4 w-4 text-mint" />,
              step: "04",
              title: "Confirm recovery",
              body: "The next healthy run closes the incident and sends a recovery email. Duplicates are suppressed.",
            },
          ].map((item) => (
            <div key={item.step} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-line2 bg-panel2">
                  {item.icon}
                </span>
                <span className="font-mono text-[10px] text-faint">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-text">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          Delivery uses RESEND_API_KEY and ALERT_TO_EMAIL. Without credentials the
          pipeline still records each incident and shows a preview of the email, so
          the flow is demonstrable before you connect a Resend account.
        </p>
      </section>

      {/* Message contract */}
      <section className="mt-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
            The message contract
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
            How an API failure becomes a human sentence
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The integration maps the technical result to one customer-safe
            message. The customer gets clarity. The developer keeps the raw
            evidence in the support code and logs.
          </p>
        </div>

        <div className="card mt-6 overflow-hidden">
          <div className="hidden grid-cols-[130px_1fr_1.2fr_120px] gap-4 border-b border-line px-5 py-3 text-[10px] uppercase tracking-wider text-faint md:grid">
            <span>API result</span>
            <span>Customer sees</span>
            <span>Why this wording</span>
            <span className="text-right">Money</span>
          </div>
          <div className="divide-y divide-line">
            {MESSAGES.map((row) => (
              <div
                key={row.status}
                className="grid gap-2 px-5 py-4 md:grid-cols-[130px_1fr_1.2fr_120px] md:items-center md:gap-4"
              >
                <span
                  className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 font-mono text-[11px] ${row.tone}`}
                >
                  {row.status}
                </span>
                <span className="text-sm font-medium text-text">{row.user}</span>
                <span className="text-xs leading-relaxed text-muted">
                  {row.detail}
                </span>
                <span className="text-xs text-faint md:text-right">
                  {row.money}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="mt-16 grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <Shield className="h-5 w-5 text-mint" />
          <h3 className="mt-3 text-sm font-semibold text-text">
            Protect the customer first
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Every failure path says whether money moved. “Not charged” removes the
            most expensive ambiguity in a broken checkout.
          </p>
        </div>
        <div className="card p-5">
          <Code className="h-5 w-5 text-sky" />
          <h3 className="mt-3 text-sm font-semibold text-text">
            Keep the evidence
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            The customer sees a short support code. The developer sees the status,
            error code, latency, and full response in the trace below the panel.
          </p>
        </div>
        <div className="card p-5">
          <Zap className="h-5 w-5 text-warn" />
          <h3 className="mt-3 text-sm font-semibold text-text">
            Make retry safe
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            A 5xx response is caught before success is shown. The cart stays put,
            so retrying cannot silently charge the customer twice.
          </p>
        </div>
      </section>

      <section className="card mt-8 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-line2 bg-panel2 text-mint">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-text">
              This is one flow. Your product has many.
            </h2>
            <p className="mt-1 text-xs text-muted">
              Publish your own scenarios in the studio and let customers test both
              the happy path and the broken path.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/provider/new" className="btn-primary px-3 py-2 text-xs">
            Publish a sandbox
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/runs" className="btn-ghost px-3 py-2 text-xs">
            See proof reports
          </Link>
        </div>
      </section>

      <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-faint">
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3 w-3 text-mint" />
          Real fetch calls, no mocked UI state
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-mint" />
          Latency measured in the browser
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Code className="h-3 w-3 text-mint" />
          Endpoint also testable with curl
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Mail className="h-3 w-3 text-mint" />
          Developer alerts delivered through Resend
        </span>
      </p>
    </div>
  );
}
