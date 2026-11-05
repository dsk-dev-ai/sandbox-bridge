import Link from "next/link";
import type { Metadata } from "next";
import { listRuns } from "@/lib/store";
import { EmptyState, ReadinessBadge, RunStatusPill } from "@/components/ui";
import { ArrowRight, ClipboardIcon, Flask, Shield } from "@/components/icons";
import { formatDate, formatDuration, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proof reports",
  description:
    "Every sandbox run produces a timestamped proof report shared by the developer and the customer.",
};

export default function RunsPage() {
  const runs = listRuns(100);
  const passed = runs.filter((run) => run.status === "passed").length;
  const passRate = runs.length ? Math.round((passed / runs.length) * 100) : 0;
  const avgScore = runs.length
    ? Math.round(
        runs.reduce((sum, run) => sum + run.readinessScore, 0) / runs.length
      )
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
            Shared evidence
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Proof reports
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Every run is immutable evidence of what a product did when a customer
            tried to use it. Open one to see the full request trace, the expected
            contract, and the readiness verdict.
          </p>
        </div>
        <div className="flex gap-3 text-center">
          <div className="card px-4 py-3">
            <p className="text-xl font-semibold text-text">{runs.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-faint">
              Reports
            </p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-xl font-semibold text-mint">{passRate}%</p>
            <p className="text-[10px] uppercase tracking-wider text-faint">
              Pass rate
            </p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-xl font-semibold text-text">{avgScore}</p>
            <p className="text-[10px] uppercase tracking-wider text-faint">
              Avg score
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {runs.length === 0 ? (
          <EmptyState
            title="No proof has been generated yet"
            description="Open a sandbox, pick a scenario, and run it. The resulting report will show up here with a full trace."
            action={{ href: "/catalog", label: "Browse sandboxes" }}
          />
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            <div className="hidden items-center gap-4 px-5 py-3 text-[10px] uppercase tracking-wider text-faint sm:flex">
              <span className="w-28">Verdict</span>
              <span className="flex-1">Scenario</span>
              <span className="w-24 text-center">Mode</span>
              <span className="w-24 text-center">Readiness</span>
              <span className="w-20 text-right">Steps</span>
              <span className="w-28 text-right">Started</span>
              <span className="w-4" />
            </div>
            {runs.map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-panel2/50 sm:flex-nowrap sm:gap-4"
              >
                <span className="w-28 shrink-0">
                  <RunStatusPill status={run.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {run.scenarioName}
                  </p>
                  <p className="truncate text-xs text-faint">
                    <span className="text-muted">{run.sandboxName}</span> · report
                    #{String(run.id).padStart(4, "0")}
                  </p>
                </div>
                <span className="w-24 shrink-0 text-center font-mono text-[11px] uppercase text-muted">
                  {run.mode}
                </span>
                <span className="w-24 shrink-0 text-center">
                  <ReadinessBadge score={run.readinessScore} showLabel={false} />
                </span>
                <span className="w-20 shrink-0 text-right font-mono text-xs text-muted">
                  {run.stepsPassed}/{run.stepsTotal}
                </span>
                <span className="w-28 shrink-0 text-right text-xs text-faint">
                  <span className="block">{timeAgo(run.startedAt)}</span>
                  <span className="block text-[10px]">
                    {formatDuration(run.durationMs)}
                  </span>
                </span>
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-faint sm:block" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <Flask className="h-5 w-5 text-mint" />
          <h3 className="mt-3 text-sm font-semibold text-text">
            Reproducible by design
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            The report records mode, chaos level, per-step latency, and the exact
            response body that was returned.
          </p>
        </div>
        <div className="card p-5">
          <Shield className="h-5 w-5 text-sky" />
          <h3 className="mt-3 text-sm font-semibold text-text">
            Honest about failure
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Failed assertions are shown next to the promise they broke, so both
            sides know what to fix.
          </p>
        </div>
        <div className="card p-5">
          <ClipboardIcon className="h-5 w-5 text-warn" />
          <h3 className="mt-3 text-sm font-semibold text-text">
            Good enough to share
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Send the report link to a customer, a security team, or your own
            launch review. No login required in this demo.
          </p>
        </div>
      </div>

      <p className="mt-8 text-center text-[11px] text-faint">
        {passed} passed · {runs.length - passed} failed · newest first ·{" "}
        {runs[0] ? `last run ${formatDate(runs[0].startedAt)}` : "no runs"}
      </p>
    </div>
  );
}
