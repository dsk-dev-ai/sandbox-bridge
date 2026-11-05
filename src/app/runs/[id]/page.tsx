import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRun, getScenarioWithSteps } from "@/lib/store";
import {
  Activity,
  Alert,
  ArrowRight,
  Check,
  Clock,
  Code,
  Flask,
  Shield,
  X,
  Zap,
} from "@/components/icons";
import { MethodBadge, RunStatusPill } from "@/components/ui";
import { CopyLink } from "@/components/copy-link";
import {
  cn,
  formatDate,
  formatDuration,
  prettyJson,
  readinessTone,
  timeAgo,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { id } = await params;
  const run = getRun(Number(id));
  if (!run) return { title: "Proof report not found" };
  return {
    title: `Proof report #${String(run.id).padStart(4, "0")}`,
    description: `${run.scenarioName} on ${run.sandboxName} — readiness ${run.readinessScore}/100.`,
  };
}

export default async function RunPage({ params }: { params: PageParams }) {
  const { id } = await params;
  const runId = Number(id);
  const run = Number.isInteger(runId) ? getRun(runId) : null;
  if (!run) notFound();

  const scenario = getScenarioWithSteps(run.scenarioId);
  const tone = readinessTone(run.readinessScore);
  const failedSteps = run.steps.filter((step) => !step.passed);
  const reliabilityPercent = Math.round(run.reliability * 100);
  const circumference = 2 * Math.PI * 52;
  const dash = (run.readinessScore / 100) * circumference;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-faint">
        <Link href="/runs" className="hover:text-mint">
          Proof reports
        </Link>
        <span>/</span>
        <span className="font-mono text-muted">
          #{String(run.id).padStart(4, "0")}
        </span>
      </nav>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <RunStatusPill status={run.status} />
            <span className="chip font-mono uppercase">{run.mode} mode</span>
            <span className="chip">
              <Shield className="h-3.5 w-3.5 text-mint" />
              Immutable trace
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {run.scenarioName}
          </h1>
          <p className="mt-2 text-sm text-muted">
            <Link
              href={`/sandbox/${run.sandboxSlug}`}
              className="text-mint hover:underline"
            >
              {run.sandboxName}
            </Link>{" "}
            · run {timeAgo(run.startedAt)} · {formatDate(run.startedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <CopyLink path={`/runs/${run.id}`} label="Share report" />
          <Link
            href={`/sandbox/${run.sandboxSlug}#scenarios`}
            className="btn-primary px-3 py-2 text-xs"
          >
            Run again
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-[280px_1fr]">
        {/* Score */}
        <div className="card flex flex-col items-center p-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            Readiness verdict
          </p>
          <div className="relative mt-4">
            <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="10"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                fill="none"
                stroke="currentColor"
                className={tone.text}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold tracking-tight text-text">
                {run.readinessScore}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-faint">
                / 100
              </span>
            </div>
          </div>
          <p className={cn("mt-3 text-sm font-semibold", tone.text)}>
            {tone.label}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {run.stepsPassed} of {run.stepsTotal} assertions matched the published
            contract.
          </p>
        </div>

        {/* Summary */}
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <Flask className="h-4 w-4 text-mint" />
            <h2 className="text-sm font-semibold text-text">
              What this run proves
            </h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text">{run.summary}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-line bg-ink/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Steps
              </p>
              <p className="mt-0.5 text-sm font-semibold text-text">
                {run.stepsPassed}/{run.stepsTotal}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-ink/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Reliability
              </p>
              <p className="mt-0.5 text-sm font-semibold text-text">
                {reliabilityPercent}%
              </p>
            </div>
            <div className="rounded-lg border border-line bg-ink/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Avg latency
              </p>
              <p className="mt-0.5 text-sm font-semibold text-text">
                {run.avgLatencyMs}ms
              </p>
            </div>
            <div className="rounded-lg border border-line bg-ink/40 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Total time
              </p>
              <p className="mt-0.5 text-sm font-semibold text-text">
                {formatDuration(run.durationMs)}
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2 text-xs text-muted">
            <li className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
              Ran under{" "}
              <span className="text-text">
                {run.mode} conditions
              </span>{" "}
              with a {Math.round(run.chaos * 100)}% chaos level.
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
              {reliabilityPercent === 100
                ? "No injected failures occurred during this run."
                : `${Math.round((1 - run.reliability) * run.stepsTotal)} injected failure${Math.round((1 - run.reliability) * run.stepsTotal) === 1 ? "" : "s"} occurred during this run.`}
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
              Every response below is the exact body the sandbox returned, not a
              screenshot.
            </li>
          </ul>
        </div>
      </div>

      {/* Trace */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
              Execution trace
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-text">
              Step by step, in order
            </h2>
          </div>
          <span className="text-xs text-faint">
            {run.steps.length} step{run.steps.length === 1 ? "" : "s"}
          </span>
        </div>

        <ol className="mt-5 space-y-3">
          {run.steps.map((step, index) => {
            const expected = scenario?.steps.find(
              (item) => item.position === step.position
            );
            return (
              <li
                key={step.id}
                className={cn(
                  "card overflow-hidden border-l-2",
                  step.passed ? "border-l-mint/60" : "border-l-bad/60"
                )}
              >
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      step.passed
                        ? "bg-mint/15 text-mint"
                        : "bg-bad/15 text-bad"
                    )}
                  >
                    {step.passed ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">
                      {index + 1}. {step.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                      <MethodBadge
                        method={step.method}
                        className="min-w-11 px-1.5 py-0"
                      />
                      <code className="font-mono text-muted">{step.path}</code>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {step.latencyMs}ms
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="rounded-md border border-line2 bg-panel2 px-2 py-1 font-mono text-muted">
                      HTTP {step.responseStatus}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-medium",
                        step.passed ? "text-mint" : "text-bad"
                      )}
                    >
                      {step.passed ? "matched" : "diverged"}
                    </span>
                  </div>
                </div>

                {!step.passed && step.error ? (
                  <p className="mx-5 mb-3 flex items-start gap-2 rounded-lg border border-bad/20 bg-bad/5 px-3 py-2 text-xs text-bad">
                    <Alert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {step.error}
                  </p>
                ) : null}

                <details className="group border-t border-line/70">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-2.5 text-[10px] uppercase tracking-wider text-faint [&::-webkit-details-marker]:hidden">
                    Expected contract &amp; actual payload
                    <ArrowRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-[10px] uppercase tracking-wider text-faint">
                        Expected
                      </p>
                      <div className="space-y-2 rounded-lg border border-line bg-ink/40 p-3 text-xs">
                        <p className="text-muted">
                          Status:{" "}
                          <span className="font-mono text-text">
                            {expected?.expectedStatus ?? "?"}
                          </span>
                        </p>
                        <p className="text-muted">
                          Body contains:{" "}
                          <span className="font-mono text-text">
                            {expected?.expectedContains || "(no assertion)"}
                          </span>
                        </p>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-faint">
                            Request
                          </p>
                          <pre className="mt-1 max-h-36 overflow-auto rounded border border-line bg-panel p-2 font-mono text-[10px] leading-relaxed text-muted">
                            {prettyJson(step.requestBody)}
                          </pre>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] uppercase tracking-wider text-faint">
                        Actual response
                      </p>
                      <pre
                        className={cn(
                          "max-h-52 overflow-auto rounded-lg border p-3 font-mono text-[10px] leading-relaxed",
                          step.passed
                            ? "border-line bg-ink/40 text-muted"
                            : "border-bad/25 bg-bad/5 text-bad/90"
                        )}
                      >
                        {prettyJson(step.responseBody)}
                      </pre>
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Verdict */}
      <section className="mt-10">
        <div
          className={cn(
            "card p-6",
            run.status === "passed"
              ? "border-mint/25 bg-mint/5"
              : "border-warn/25 bg-warn/5"
          )}
        >
          <div className="flex items-center gap-2">
            {run.status === "passed" ? (
              <Shield className="h-5 w-5 text-mint" />
            ) : (
              <Alert className="h-5 w-5 text-warn" />
            )}
            <h2 className="text-base font-semibold text-text">
              {run.status === "passed"
                ? "Verdict: the contract held"
                : "Verdict: the contract did not hold"}
            </h2>
          </div>

          {run.status === "passed" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <VerdictPoint
                icon={<Activity className="h-4 w-4 text-mint" />}
                title="Customer-facing flow works"
                body="Every persona step completed with the promised status and response contract."
              />
              <VerdictPoint
                icon={<Zap className="h-4 w-4 text-warn" />}
                title="Test the edges next"
                body="Re-run this scenario in stress or chaos mode to see whether it degrades gracefully."
              />
              <VerdictPoint
                icon={<Code className="h-4 w-4 text-sky" />}
                title="Integrate with confidence"
                body="Use the trace as the acceptance baseline for your own integration tests."
              />
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted">
                These assertions failed. The provider should fix them before a
                customer builds on this contract:
              </p>
              <ul className="mt-3 space-y-2">
                {failedSteps.map((step) => (
                  <li
                    key={step.id}
                    className="flex items-start gap-2 rounded-lg border border-bad/20 bg-bad/5 px-3 py-2 text-xs text-bad"
                  >
                    <Alert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      <span className="font-medium">{step.name}:</span>{" "}
                      {step.error || "The response did not match the contract."}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/sandbox/${run.sandboxSlug}#scenarios`}
              className="btn-ghost px-3 py-2 text-xs"
            >
              Re-run this scenario
            </Link>
            <CopyLink path={`/runs/${run.id}`} label="Copy report link" />
            <Link href="/runs" className="btn-subtle px-3 py-2 text-xs">
              All reports
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function VerdictPoint({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-4">
      <span className="grid h-8 w-8 place-items-center rounded-lg border border-line2 bg-panel2">
        {icon}
      </span>
      <p className="mt-3 text-xs font-semibold text-text">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}
