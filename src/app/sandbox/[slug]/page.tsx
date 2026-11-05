import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSandboxDetails,
  listRunsForSandbox,
} from "@/lib/store";
import {
  Activity,
  Alert,
  ArrowRight,
  Check,
  Clock,
  Code,
  Globe,
  Layers,
  Play,
  Shield,
  Users,
  Zap,
} from "@/components/icons";
import {
  MethodBadge,
  ReadinessBadge,
  RunStatusPill,
  ScoreBar,
  StatusPill,
} from "@/components/ui";
import { ScenarioRunner } from "@/components/scenario-runner";
import { CopyLink } from "@/components/copy-link";
import { formatDuration, readinessTone, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const sandbox = getSandboxDetails(slug);
  if (!sandbox) return { title: "Sandbox not found" };
  return {
    title: sandbox.name,
    description: sandbox.tagline,
  };
}

export default async function SandboxPage({
  params,
}: {
  params: PageParams;
}) {
  const { slug } = await params;
  const sandbox = getSandboxDetails(slug);
  if (!sandbox) notFound();

  const runs = listRunsForSandbox(sandbox.id, 6);
  const avgReadiness = runs.length
    ? Math.round(
        runs.reduce((sum, run) => sum + run.readinessScore, 0) / runs.length
      )
    : 0;
  const tone = readinessTone(avgReadiness);
  const totalSteps = sandbox.scenarios.reduce(
    (sum, scenario) => sum + scenario.steps.length,
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-2 text-xs text-faint">
        <Link href="/catalog" className="hover:text-mint">
          Catalog
        </Link>
        <span>/</span>
        <span className="text-muted">{sandbox.industry}</span>
        <span>/</span>
        <span className="text-text">{sandbox.name}</span>
      </nav>

      {sandbox.status === "draft" ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          <Alert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">This sandbox is still a draft.</p>
            <p className="mt-0.5 text-xs text-warn/80">
              You are previewing the developer workspace. Publish it to list it in
              the catalog.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{sandbox.industry}</span>
            <StatusPill status={sandbox.status} />
            <span className="chip font-mono">{sandbox.version}</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            {sandbox.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            {sandbox.tagline}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            {sandbox.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-faint">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {sandbox.providerName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5" />
              {sandbox.endpoints.length} endpoints
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              {sandbox.scenarios.length} scenarios · {totalSteps} steps
            </span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Sandbox readiness
            </p>
            <Shield className="h-4 w-4 text-mint" />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-text">
            {runs.length ? avgReadiness : "—"}
            <span className="ml-1 text-sm font-normal text-faint">/100</span>
          </p>
          <p className={`mt-1 text-xs ${tone.text}`}>
            {runs.length ? tone.label : "No proof runs yet"}
          </p>
          <div className="mt-3">
            <ScoreBar score={avgReadiness} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
            <div>
              <p className="text-sm font-semibold text-text">{runs.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Runs
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-text">
                {runs.filter((run) => run.status === "passed").length}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Passed
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-text">
                {runs.length ? formatDuration(runs[0].durationMs) : "—"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Last run
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <a href="#scenarios" className="btn-primary flex-1 px-3 py-2 text-xs">
              <Play className="h-3.5 w-3.5" />
              Run a scenario
            </a>
            <CopyLink path={`/sandbox/${sandbox.slug}`} label="Share" />
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-12">
          {/* Scenarios */}
          <section id="scenarios" className="scroll-mt-24">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
                  Customer scenarios
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                  Run the product like a customer
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted">
                  Each scenario is a persona with a goal. Steps assert the exact
                  status and contract text. Choose how harsh the world should be,
                  then watch the trace.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {sandbox.scenarios.length === 0 ? (
                <div className="card px-5 py-10 text-center text-sm text-muted">
                  The provider has not published any scenarios yet.
                </div>
              ) : (
                sandbox.scenarios.map((scenario) => (
                  <div key={scenario.id} className="space-y-3">
                    <div className="card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-sky" />
                            <p className="text-xs font-medium text-sky">
                              {scenario.persona || "Customer"}
                            </p>
                          </div>
                          <h3 className="mt-1.5 text-lg font-semibold text-text">
                            {scenario.name}
                          </h3>
                          <p className="mt-1 max-w-2xl text-sm text-muted">
                            {scenario.description}
                          </p>
                        </div>
                        <span className="chip">
                          <Check className="h-3.5 w-3.5 text-mint" />
                          {scenario.steps.length} assertions
                        </span>
                      </div>

                      {scenario.goal ? (
                        <div className="mt-4 rounded-lg border border-line bg-ink/40 px-4 py-3">
                          <p className="text-[10px] uppercase tracking-wider text-faint">
                            Customer goal
                          </p>
                          <p className="mt-1 text-sm text-text">{scenario.goal}</p>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {scenario.steps.map((step, index) => (
                          <div
                            key={step.id}
                            className="flex items-center gap-2"
                          >
                            <div className="flex items-center gap-2 rounded-lg border border-line bg-panel2/60 px-2.5 py-1.5">
                              <span className="grid h-4 w-4 place-items-center rounded-full bg-line2 text-[9px] font-semibold text-muted">
                                {index + 1}
                              </span>
                              {step.endpoint ? (
                                <MethodBadge
                                  method={step.endpoint.method}
                                  className="min-w-10 px-1 py-0 text-[9px]"
                                />
                              ) : null}
                              <span className="max-w-52 truncate text-[11px] text-muted">
                                {step.name}
                              </span>
                            </div>
                            {index < scenario.steps.length - 1 ? (
                              <ArrowRight className="h-3 w-3 text-faint" />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>

                    <ScenarioRunner
                      scenario={{
                        id: scenario.id,
                        name: scenario.name,
                        steps: scenario.steps.map((step) => ({
                          id: step.id,
                          name: step.name,
                          method: step.endpoint?.method ?? "?",
                          path: step.endpoint?.path ?? "unresolved",
                          expectedStatus: step.expectedStatus,
                          expectedContains: step.expectedContains,
                        })),
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Endpoints */}
          <section className="scroll-mt-24">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
                Published contract
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                Endpoints in this sandbox
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Mock responses, latency, and failure rates as the provider
                published them. Expand a row to inspect the response payload.
              </p>
            </div>

            <div className="card mt-6 divide-y divide-line overflow-hidden">
              {sandbox.endpoints.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">
                  No endpoints published yet.
                </p>
              ) : (
                sandbox.endpoints.map((endpoint) => (
                  <details key={endpoint.id} className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-panel2/50 [&::-webkit-details-marker]:hidden">
                      <MethodBadge method={endpoint.method} />
                      <code className="font-mono text-sm text-text">
                        {endpoint.path}
                      </code>
                      <span className="hidden min-w-0 flex-1 truncate text-xs text-faint sm:block">
                        {endpoint.name}
                      </span>
                      <span className="ml-auto flex items-center gap-3 text-[11px] text-faint">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {endpoint.latencyMs}ms
                        </span>
                        <span className="font-mono">
                          {Math.round(endpoint.errorRate * 100)}% fail
                        </span>
                        <span className="font-mono text-muted">
                          {endpoint.statusCode}
                        </span>
                      </span>
                    </summary>
                    <div className="border-t border-line bg-ink/30 px-5 py-4">
                      <p className="text-xs text-muted">{endpoint.description}</p>
                      <p className="mt-3 text-[10px] uppercase tracking-wider text-faint">
                        Mock response
                      </p>
                      <pre className="mt-1.5 max-h-64 overflow-auto rounded-lg border border-line bg-panel p-3 font-mono text-[11px] leading-relaxed text-muted">
                        {endpoint.responseBody}
                      </pre>
                    </div>
                  </details>
                ))
              )}
            </div>
          </section>

          {/* Recent runs */}
          <section className="scroll-mt-24">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
                  Evidence
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text">
                  Recent proof runs
                </h2>
              </div>
              <Link href="/runs" className="text-xs text-muted hover:text-mint">
                All reports
              </Link>
            </div>

            <div className="card mt-6 divide-y divide-line overflow-hidden">
              {runs.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">
                  No runs yet. Pick a scenario above and generate the first proof.
                </p>
              ) : (
                runs.map((run) => (
                  <Link
                    key={run.id}
                    href={`/runs/${run.id}`}
                    className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-panel2/50"
                  >
                    <RunStatusPill status={run.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {run.scenarioName}
                      </p>
                      <p className="text-xs text-faint">
                        {run.mode} mode · {timeAgo(run.startedAt)} ·{" "}
                        {formatDuration(run.durationMs)}
                      </p>
                    </div>
                    <ReadinessBadge score={run.readinessScore} showLabel={false} />
                    <span className="font-mono text-xs text-faint">
                      {run.stepsPassed}/{run.stepsTotal}
                    </span>
                    <ArrowRight className="h-4 w-4 text-faint" />
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="card p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              How the proof works
            </p>
            <ul className="mt-4 space-y-4 text-xs text-muted">
              <li className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line2 bg-panel2 text-mint">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block font-medium text-text">
                    Contract assertions
                  </span>
                  Each step checks the HTTP status and a promised token in the
                  response body.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line2 bg-panel2 text-warn">
                  <Zap className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block font-medium text-text">
                    Failure injection
                  </span>
                  Stress and chaos modes raise latency and inject 5xx responses
                  based on the provider&apos;s error rate.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line2 bg-panel2 text-sky">
                  <Activity className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block font-medium text-text">
                    Readiness score
                  </span>
                  55% pass rate, 25% reliability, 20% endpoint coverage. A single
                  happy path cannot score high.
                </span>
              </li>
            </ul>
          </div>

          <div className="card p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Provided by
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky/15 text-sm font-semibold text-sky">
                {sandbox.providerName.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium text-text">
                  {sandbox.providerName}
                </p>
                <p className="text-[11px] text-faint">
                  {sandbox.industry} · {sandbox.version}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs text-muted">
              <p className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-faint" />
                Updated {timeAgo(sandbox.updatedAt)}
              </p>
              <p className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-faint" />
                {sandbox.endpoints.length} endpoints ·{" "}
                {sandbox.scenarios.length} scenarios
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <CopyLink
                path={`/sandbox/${sandbox.slug}`}
                label="Copy link"
                className="flex-1"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-mint/20 bg-gradient-to-br from-mint/10 to-transparent p-5">
            <p className="text-sm font-semibold text-text">
              Own a product like this?
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Publish a sandbox and let your customers generate their own proof
              before they commit.
            </p>
            <Link href="/provider/new" className="btn-primary mt-4 w-full text-xs">
              Publish a sandbox
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
