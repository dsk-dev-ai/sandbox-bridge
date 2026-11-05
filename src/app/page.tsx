import Link from "next/link";
import {
  getLeaderboard,
  getRun,
  getSandboxDetails,
  getStats,
  listRuns,
} from "@/lib/store";
import {
  ArrowRight,
  ArrowUpRight,
  Activity,
  Check,
  Clock,
  Code,
  Flask,
  Layers,
  Play,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
} from "@/components/icons";
import {
  ReadinessBadge,
  RunStatusPill,
  SandboxCard,
  SectionHeading,
  Stat,
} from "@/components/ui";
import { formatDuration, readinessTone, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Developers publish the real contract",
    body: "Model your endpoints, latency, failure rates, and the scenarios customers actually care about. No mock-up screenshots. A runnable sandbox of your product.",
    icon: <Code />,
  },
  {
    step: "02",
    title: "Customers run their world against it",
    body: "Pick a persona, run the scenario under normal, stress, or chaos conditions, and watch every request and response in order.",
    icon: <Play />,
  },
  {
    step: "03",
    title: "Both sides get one shared proof",
    body: "A timestamped, shareable report shows what passed, what diverged, and whether the product is safe to adopt — before contracts or migrations.",
    icon: <Shield />,
  },
];

const CHECKS = [
  {
    title: "Contract drift",
    body: "Steps assert the exact status and promise in the response. The moment the product stops matching the docs, the proof fails.",
    icon: <Code />,
  },
  {
    title: "Real-world failure",
    body: "Inject stress and chaos. See whether the product degrades gracefully or takes the customer's workflow down with it.",
    icon: <Zap />,
  },
  {
    title: "Latency promises",
    body: "Every trace records simulated response time, so a customer can judge the experience — not just the feature list.",
    icon: <Clock />,
  },
  {
    title: "Coverage gaps",
    body: "Readiness weighs how much of the product a scenario actually exercises, so a single happy path cannot fake a launch.",
    icon: <Layers />,
  },
];

export default function HomePage() {
  const stats = getStats();
  const published = getLeaderboard(3);
  const recentRuns = listRuns(4);
  const featured = published
    .map((entry) => {
      const details = getSandboxDetails(entry.sandbox.id);
      return details
        ? { details, runs: entry.runs, readiness: entry.readiness }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const heroRun = recentRuns[0] ? getRun(recentRuns[0].id) : null;
  const heroScore = heroRun?.readinessScore ?? 94;
  const heroTone = readinessTone(heroScore);

  return (
    <div>
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden border-b border-line">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          <div className="fade-up">
            <span className="chip border-mint/25 bg-mint/5 text-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint dot-pulse" />
              Two-sided sandbox · proof before purchase
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-text sm:text-5xl lg:text-6xl">
              Prove the product works
              <span className="block text-mint">before the world finds out.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Proving Ground is a sandbox bridge between the people who build
              software and the people who have to live with it. Developers publish
              a runnable version of their product. Customers run real scenarios
              against it and walk away with evidence — not a sales deck.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/catalog" className="btn-primary">
                Browse live sandboxes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/provider/new" className="btn-ghost">
                Publish your product
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <Link
              href="/demo"
              className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-mint hover:underline"
            >
              See a working API and a broken API handle the same payment
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-faint">
              <span className="inline-flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint" />
                No integration required to evaluate
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint" />
                Runs under normal, stress &amp; chaos
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint" />
                Shareable proof report
              </span>
            </div>
          </div>

          {/* Hero proof card */}
          <div className="fade-up relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-mint/5 blur-2xl" />
            <div className="card relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-faint">
                  <Flask className="h-4 w-4 text-mint" />
                  Proof report
                  {heroRun ? (
                    <span className="text-muted">#{String(heroRun.id).padStart(4, "0")}</span>
                  ) : (
                    <span className="text-muted">live preview</span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${heroTone.border} ${heroTone.bg} ${heroTone.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${heroTone.bar}`} />
                  {heroScore} · {heroTone.label}
                </span>
              </div>

              <div className="px-5 py-4">
                <p className="text-xs uppercase tracking-wider text-faint">
                  {heroRun ? heroRun.sandboxName : "PayPilot Checkout API"}
                </p>
                <p className="mt-1 text-sm font-semibold text-text">
                  {heroRun ? heroRun.scenarioName : "First-time customer checkout"}
                </p>

                <div className="mt-4 space-y-2">
                  {(heroRun
                    ? heroRun.steps ?? []
                    : [
                        { id: 1, name: "Create the payment intent", method: "POST", path: "/v1/payment_intents", latencyMs: 181, passed: true, error: "" },
                        { id: 2, name: "Confirm the card payment", method: "POST", path: "/v1/payment_intents/{id}/confirm", latencyMs: 243, passed: true, error: "" },
                        { id: 3, name: "Render the receipt", method: "GET", path: "/v1/payment_intents/{id}", latencyMs: 89, passed: true, error: "" },
                      ]
                  ).map((step) =>
                    "id" in step ? (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 rounded-lg border border-line bg-ink/40 px-3 py-2.5"
                      >
                        <span
                          className={`grid h-5 w-5 place-items-center rounded-full ${step.passed ? "bg-mint/15 text-mint" : "bg-bad/15 text-bad"}`}
                        >
                          {step.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-text">{step.name}</p>
                          <p className="truncate font-mono text-[10px] text-faint">
                            {step.method} {step.path}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-muted">{step.latencyMs}ms</span>
                      </div>
                    ) : null
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-faint">
                    <Shield className="h-3.5 w-3.5 text-mint" />
                    Trace locked · {heroRun ? timeAgo(heroRun.startedAt) : "example"}
                  </span>
                  <span className="font-mono text-muted">
                    {heroRun ? formatDuration(heroRun.durationMs) : "513ms"} total
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-4 hidden rounded-xl border border-line bg-panel px-4 py-3 shadow-2xl sm:block">
              <p className="font-mono text-[10px] uppercase tracking-widest text-faint">
                shared with
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-sky/15 text-[10px] font-semibold text-sky">
                  DP
                </span>
                <span className="text-xs text-muted">developer + customer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="Live sandboxes"
              value={stats.publishedSandboxes}
              hint={`${stats.endpoints} endpoints mapped`}
              icon={<GlobeIcon />}
            />
            <Stat
              label="Runnable scenarios"
              value={stats.scenarios}
              hint="Persona-driven, not demos"
              icon={<Users />}
            />
            <Stat
              label="Proof runs"
              value={stats.runs}
              hint={stats.runs > 0 ? `${stats.passRate}% passed end-to-end` : "Run one to start the record"}
              icon={<Activity />}
            />
            <Stat
              label="Avg readiness"
              value={stats.runs > 0 ? `${stats.avgReadiness}/100` : "—"}
              hint="Weighted pass rate, reliability, coverage"
              icon={<Shield />}
            />
          </div>
        </div>
      </section>

      {/* The bridge */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The bridge"
          title="One product, two audiences, one source of truth"
          description="Usually developers prove things to themselves in staging, and customers make promises to their boss from a PDF. Proving Ground puts both parties in the same room."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="card relative p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-line2 bg-panel2 text-mint">
                  {item.icon}
                </span>
                <span className="font-mono text-xs text-faint">{item.step}</span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-text">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="card mt-4 grid gap-px overflow-hidden bg-line md:grid-cols-2">
          <div className="bg-panel p-6 sm:p-8">
            <span className="chip border-sky/25 bg-sky/5 text-sky">
              <Code className="h-3.5 w-3.5" />
              For developers
            </span>
            <h3 className="mt-4 text-lg font-semibold text-text">
              Ship trust, not just an API key
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {[
                "Publish endpoints with realistic latency and failure behavior",
                "Write scenarios around real personas and real goals",
                "Let buyers self-verify instead of burning sales engineering time",
                "Watch where integrations fail before the support ticket exists",
              ].map((line) => (
                <li key={line} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
                  {line}
                </li>
              ))}
            </ul>
            <Link href="/provider" className="btn-ghost mt-6">
              Open the studio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-panel p-6 sm:p-8">
            <span className="chip border-mint/25 bg-mint/5 text-mint">
              <Users className="h-3.5 w-3.5" />
              For customers
            </span>
            <h3 className="mt-4 text-lg font-semibold text-text">
              Know before you migrate
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {[
                "Run the vendor's product against your own workflow",
                "See every request, response, and delay in order",
                "Stress it like your busiest day, not their demo",
                "Bring a timestamped proof report to the buying decision",
              ].map((line) => (
                <li key={line} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                  {line}
                </li>
              ))}
            </ul>
            <Link href="/catalog" className="btn-ghost mt-6">
              Explore the catalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What it catches */}
      <section id="trust" className="border-y border-line bg-panel/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What the proof catches"
            title="The failures that only appear in the real world"
            description="A sandbox is not a screenshot gallery. Each run checks the product against the promise a customer is about to build on."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CHECKS.map((check) => (
              <div key={check.title} className="card p-5">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-line2 bg-panel2 text-mint">
                  {check.icon}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-text">
                  {check.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {check.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured sandboxes */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="In the sandbox"
          title="Live products you can test right now"
          description="Each one is a two-sided contract: a provider published it, and any customer can run it."
          actions={
            <Link href="/catalog" className="btn-ghost">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <SandboxCard
              key={item.details.id}
              sandbox={item.details}
              runs={item.runs}
              readiness={item.readiness}
            />
          ))}
        </div>
      </section>

      {/* Recent runs */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-mint" />
              <h3 className="text-sm font-semibold text-text">
                Latest proof runs
              </h3>
            </div>
            <Link href="/runs" className="text-xs text-muted hover:text-mint">
              All reports
            </Link>
          </div>
          {recentRuns.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted">
                No proof runs yet. Open a sandbox and run a scenario — the report
                will land here.
              </p>
              <Link href="/catalog" className="btn-ghost mt-4">
                Find a sandbox
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recentRuns.map((run) => (
                <li key={run.id}>
                  <Link
                    href={`/runs/${run.id}`}
                    className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-panel2/60"
                  >
                    <RunStatusPill status={run.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {run.scenarioName}
                      </p>
                      <p className="truncate text-xs text-faint">
                        {run.sandboxName} · {run.mode} mode · {timeAgo(run.startedAt)}
                      </p>
                    </div>
                    <ReadinessBadge score={run.readinessScore} />
                    <span className="font-mono text-xs text-faint">
                      {run.stepsPassed}/{run.stepsTotal}
                    </span>
                    <ArrowRight className="h-4 w-4 text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-mint/20 bg-gradient-to-br from-mint/10 via-panel to-sky/10 px-6 py-14 sm:px-12">
          <div className="grid-bg absolute inset-0 opacity-40" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
                Stop demoing. Start proving.
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">
                Put your product in the sandbox.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Ten minutes to publish a contract your customers can test. One
                shared report to replace a week of “it should work.”
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/provider/new" className="btn-primary">
                Create a sandbox
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/catalog" className="btn-ghost">
                See an example
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </svg>
  );
}
