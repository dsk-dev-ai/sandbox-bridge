import Link from "next/link";
import { Logomark } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-panel/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <Logomark />
            <div className="leading-none">
              <p className="text-sm font-semibold text-text">Proving Ground</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                sandbox bridge
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            The two-sided sandbox where developers publish realistic product
            behavior and customers prove it works before anyone commits.
          </p>
          <p className="mt-4 font-mono text-[11px] text-faint">
            Local-first demo · sandboxes persist in SQLite on this machine
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-faint">
            Customers
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/demo" className="hover:text-text">
                Working vs broken API
              </Link>
            </li>
            <li>
              <Link href="/catalog" className="hover:text-text">
                Browse sandboxes
              </Link>
            </li>
            <li>
              <Link href="/runs" className="hover:text-text">
                Proof reports
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-text">
                How it works
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-faint">
            Developers
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/provider" className="hover:text-text">
                Developer studio
              </Link>
            </li>
            <li>
              <Link href="/provider/new" className="hover:text-text">
                Publish a sandbox
              </Link>
            </li>
            <li>
              <Link href="/#trust" className="hover:text-text">
                Trust model
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Proving Ground. A sandbox bridge demo.</p>
          <p>No payment ever moves here. That is the point.</p>
        </div>
      </div>
    </footer>
  );
}
