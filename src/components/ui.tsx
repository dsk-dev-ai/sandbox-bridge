import Link from "next/link";
import type { ReactNode } from "react";
import { cn, methodTone, readinessTone } from "@/lib/utils";
import type { SandboxStatus, SandboxWithDetails } from "@/lib/types";
import {
  ArrowUpRight,
  Check,
  Layers,
  X,
} from "@/components/icons";

export function MethodBadge({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-14 items-center justify-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide",
        methodTone(method),
        className
      )}
    >
      {method.toUpperCase()}
    </span>
  );
}

export function StatusPill({ status }: { status: SandboxStatus }) {
  const published = status === "published";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        published
          ? "border-mint/30 bg-mint/10 text-mint"
          : "border-warn/30 bg-warn/10 text-warn"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          published ? "bg-mint" : "bg-warn"
        )}
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function RunStatusPill({ status }: { status: "passed" | "failed" }) {
  const passed = status === "passed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        passed
          ? "border-mint/30 bg-mint/10 text-mint"
          : "border-bad/30 bg-bad/10 text-bad"
      )}
    >
      {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {passed ? "Proof passed" : "Proof failed"}
    </span>
  );
}

export function ReadinessBadge({
  score,
  showLabel = true,
}: {
  score: number;
  showLabel?: boolean;
}) {
  const tone = readinessTone(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tone.border,
        tone.bg,
        tone.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.bar)} />
      {score}
      {showLabel ? <span className="opacity-80">· {tone.label}</span> : null}
    </span>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const tone = readinessTone(score);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div
        className={cn("h-full rounded-full transition-all", tone.bar)}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-faint">
          {label}
        </p>
        {icon ? <span className="text-muted">{icon}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-text">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card grid place-items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-line2 bg-panel2 text-muted">
        <Layers />
      </span>
      <h3 className="mt-4 text-base font-semibold text-text">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      {action ? (
        <Link href={action.href} className="btn-ghost mt-5">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function SandboxCard({
  sandbox,
  runs = 0,
  readiness,
}: {
  sandbox: SandboxWithDetails;
  runs?: number;
  readiness?: number;
}) {
  const scenarioCount = sandbox.scenarios.length;
  const endpointCount = sandbox.endpoints.length;

  return (
    <Link
      href={`/sandbox/${sandbox.slug}`}
      className="card group relative overflow-hidden p-6 transition-colors hover:border-mint/40"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mint/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="chip">{sandbox.industry}</span>
          <StatusPill status={sandbox.status} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-faint transition-colors group-hover:text-mint" />
      </div>

      <h3 className="mt-5 text-lg font-semibold tracking-tight text-text">
        {sandbox.name}
      </h3>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-muted">
        {sandbox.tagline}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs text-faint">
        <span className="text-muted">{sandbox.providerName}</span>
        <span>{endpointCount} endpoints</span>
        <span>{scenarioCount} scenarios</span>
        {runs > 0 ? <span>{runs} runs</span> : null}
        {typeof readiness === "number" && readiness > 0 ? (
          <span className="ml-auto">
            <ReadinessBadge score={readiness} showLabel={false} />
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function TimelineDots({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: Math.min(count, 6) }).map((_, index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-mint/60"
          style={{ opacity: 1 - index * 0.12 }}
        />
      ))}
    </span>
  );
}
