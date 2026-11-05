import Link from "next/link";
import { ArrowRight, Search } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-3xl place-items-center px-4 py-24 text-center sm:px-6">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-line2 bg-panel2 text-mint">
        <Search className="h-6 w-6" />
      </span>
      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
        404 · not in the sandbox
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text">
        This contract does not exist
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        The sandbox or proof report you are looking for was removed, renamed, or
        never published.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/catalog" className="btn-primary">
          Browse the catalog
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/provider" className="btn-ghost">
          Developer studio
        </Link>
      </div>
    </div>
  );
}
