import Link from "next/link";
import type { Metadata } from "next";
import {
  getLeaderboard,
  getSandboxDetails,
  listIndustries,
  listSandboxes,
} from "@/lib/store";
import { SandboxCard, EmptyState } from "@/components/ui";
import { ArrowRight, Search, Shield, Users, Zap } from "@/components/icons";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sandbox catalog",
  description:
    "Browse published product sandboxes. Run real scenarios against them and get a shareable proof report.",
};

type SearchParams = Promise<{ q?: string; industry?: string }>;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const industry = params.industry ?? "All";

  const sandboxes = listSandboxes({
    status: "published",
    industry,
    search: q || undefined,
  });
  const industries = listIndustries();
  const leaderboard = new Map(
    getLeaderboard(100).map((entry) => [
      entry.sandbox.id,
      { runs: entry.runs, readiness: entry.readiness },
    ])
  );

  const detailed = sandboxes
    .map((sandbox) => {
      const details = getSandboxDetails(sandbox.id);
      return details ? { details, ...(leaderboard.get(sandbox.id) ?? { runs: 0, readiness: 0 }) } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
            Customer side
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Test the product before you buy the promise
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Every sandbox below was published by its developer. Pick one, choose a
            persona, and run a real scenario. You will get a trace of every request
            and a readiness score you can take to your team.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-faint">
          <span className="chip">
            <Shield className="h-3.5 w-3.5 text-mint" /> Read-only contract
          </span>
          <span className="chip">
            <Zap className="h-3.5 w-3.5 text-warn" /> Chaos testing
          </span>
          <span className="chip">
            <Users className="h-3.5 w-3.5 text-sky" /> Persona scenarios
          </span>
        </div>
      </div>

      <form className="card mt-8 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by product, provider, or promise…"
            className="input pl-9"
          />
        </div>
        <select name="industry" defaultValue={industry} className="select sm:w-52">
          <option value="All">All industries</option>
          {industries.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary sm:w-auto">
          Filter
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog"}
          className={cn(
            "chip",
            industry === "All" && "border-mint/30 bg-mint/10 text-mint"
          )}
        >
          All industries
        </Link>
        {industries.map((item) => (
          <Link
            key={item}
            href={`/catalog?industry=${encodeURIComponent(item)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={cn(
              "chip",
              industry === item && "border-mint/30 bg-mint/10 text-mint"
            )}
          >
            {item}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {detailed.length === 0 ? (
          <EmptyState
            title="No sandboxes match that filter"
            description="Try a different industry or clear the search. Developers publish new sandboxes from the studio."
            action={{ href: "/provider/new", label: "Publish a sandbox" }}
          />
        ) : (
          <>
            <p className="mb-4 text-xs text-faint">
              {detailed.length} sandbox{detailed.length === 1 ? "" : "es"} ready to
              run
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {detailed.map((item) => (
                <SandboxCard
                  key={item.details.id}
                  sandbox={item.details}
                  runs={item.runs}
                  readiness={item.readiness}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card mt-12 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-text">
            Building the product instead?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Publish a sandbox and let customers prove it for themselves.
          </p>
        </div>
        <Link href="/provider/new" className="btn-primary">
          Open the studio
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
