"use client";

import Link from "next/link";
import { useState } from "react";
import type { RunMode, RunWithSteps } from "@/lib/types";
import { cn, formatDuration, prettyJson, readinessTone } from "@/lib/utils";
import {
  Alert,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Play,
  Shield,
  X,
  Zap,
} from "@/components/icons";
import { MethodBadge } from "@/components/ui";

type RunnerScenario = {
  id: number;
  name: string;
  steps: {
    id: number;
    name: string;
    method: string;
    path: string;
    expectedStatus: number;
    expectedContains: string;
  }[];
};

const MODES: {
  id: RunMode;
  label: string;
  hint: string;
}[] = [
  { id: "normal", label: "Normal", hint: "Provider's real error rate" },
  { id: "stress", label: "Stress", hint: "1.7× latency, more failures" },
  { id: "chaos", label: "Chaos", hint: "2.4× latency, heavy failures" },
];

const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, Math.max(140, ms)));

export function ScenarioRunner({
  scenario,
  compact = false,
}: {
  scenario: RunnerScenario;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<RunMode>("normal");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState<RunWithSteps["steps"]>([]);
  const [run, setRun] = useState<RunWithSteps | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setRun(null);
    setVisible([]);

    try {
      const response = await fetch(`/api/scenarios/${scenario.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "The simulation failed.");
      }
      const result = payload.run as RunWithSteps;
      for (const step of result.steps) {
        await wait(Math.min(step.latencyMs, 520) + 120);
        setVisible((current) => [...current, step]);
      }
      setRun(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setRunning(false);
    }
  }

  const total = scenario.steps.length;
  const progress = total > 0 ? Math.round((visible.length / total) * 100) : 0;
  const tone = run ? readinessTone(run.readinessScore) : null;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-mint" />
            <h3 className="truncate text-sm font-semibold text-text">
              {scenario.name}
            </h3>
          </div>
          <p className="mt-1 text-xs text-faint">
            {total} step{total === 1 ? "" : "s"} · runs in your browser against the
            published contract
          </p>
        </div>
        {run ? (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              tone?.border,
              tone?.bg,
              tone?.text
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", tone?.bar)} />
            {run.readinessScore} · {tone?.label}
          </span>
        ) : null}
      </div>

      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {MODES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              disabled={running}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-60",
                mode === option.id
                  ? "border-mint/40 bg-mint/10"
                  : "border-line2 bg-panel2/40 hover:border-line2 hover:bg-panel2"
              )}
            >
              <span
                className={cn(
                  "block text-xs font-semibold",
                  mode === option.id ? "text-mint" : "text-text"
                )}
              >
                {option.label}
              </span>
              <span className="block text-[10px] text-faint">{option.hint}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleRun}
            disabled={running || total === 0}
            className="btn-primary ml-auto"
          >
            {running ? (
              <>
                <span className="h-2 w-2 animate-ping rounded-full bg-ink" />
                Running…
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Run scenario
              </>
            )}
          </button>
        </div>

        {running || visible.length > 0 ? (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between text-[11px] text-faint">
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-mint" />
                {running
                  ? `Executing step ${Math.min(visible.length + 1, total)} of ${total}`
                  : "Trace complete"}
              </span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-mint transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <ol className="space-y-2">
              {visible.map((step, index) => (
                <li
                  key={step.id}
                  className="fade-up rounded-xl border border-line bg-ink/40"
                >
                  <div className="flex items-center gap-3 px-3 py-3">
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                        step.passed
                          ? "bg-mint/15 text-mint"
                          : "bg-bad/15 text-bad"
                      )}
                    >
                      {step.passed ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-text">
                        {index + 1}. {step.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-faint">
                        <MethodBadge method={step.method} className="min-w-11 px-1.5 py-0" />
                        <span className="max-w-64 truncate font-mono">
                          {step.path}
                        </span>
                        <span
                          className={cn(
                            "font-mono",
                            step.passed ? "text-mint" : "text-bad"
                          )}
                        >
                          HTTP {step.responseStatus}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {step.latencyMs}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {step.error ? (
                    <p className="mx-3 mb-2 flex items-start gap-2 rounded-lg border border-bad/20 bg-bad/5 px-3 py-2 text-[11px] text-bad">
                      <Alert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {step.error}
                    </p>
                  ) : null}

                  {!compact ? (
                    <details className="group border-t border-line/60">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[10px] uppercase tracking-wider text-faint [&::-webkit-details-marker]:hidden">
                        Request &amp; response
                        <ChevronDown className="h-3 w-3 group-open:rotate-180" />
                      </summary>
                      <div className="grid gap-3 px-3 pb-3 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-wider text-faint">
                            Request body
                          </p>
                          <pre className="max-h-40 overflow-auto rounded-lg border border-line bg-panel p-2.5 font-mono text-[10px] leading-relaxed text-muted">
                            {prettyJson(step.requestBody)}
                          </pre>
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] uppercase tracking-wider text-faint">
                            Response body
                          </p>
                          <pre className="max-h-40 overflow-auto rounded-lg border border-line bg-panel p-2.5 font-mono text-[10px] leading-relaxed text-muted">
                            {prettyJson(step.responseBody)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">
            <Alert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        ) : null}

        {run ? (
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-panel2/40 px-4 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Passed
              </p>
              <p className="text-sm font-semibold text-text">
                {run.stepsPassed}/{run.stepsTotal}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Avg latency
              </p>
              <p className="text-sm font-semibold text-text">
                {run.avgLatencyMs}ms
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Total time
              </p>
              <p className="text-sm font-semibold text-text">
                {formatDuration(run.durationMs)}
              </p>
            </div>
            <Link
              href={`/runs/${run.id}`}
              className="btn-ghost ml-auto px-3 py-2 text-xs"
            >
              Full proof report
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
