"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, Logomark, Plus } from "@/components/icons";

const LINKS = [
  { href: "/demo", label: "Live demo" },
  { href: "/catalog", label: "Catalog" },
  { href: "/runs", label: "Proof reports" },
  { href: "/provider", label: "Developer studio" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Logomark />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-text">
              Proving Ground
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              sandbox bridge
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-panel2 text-text"
                    : "text-muted hover:bg-panel2 hover:text-text"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/provider/new"
            className="btn-primary hidden px-3 py-2 text-xs sm:inline-flex"
          >
            <Plus className="h-3.5 w-3.5" />
            New sandbox
          </Link>

          <details className="group relative md:hidden">
            <summary className="btn-ghost cursor-pointer list-none px-3 py-2 [&::-webkit-details-marker]:hidden">
              Menu
              <ChevronDown className="h-3.5 w-3.5 group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-line bg-panel p-2 shadow-2xl">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-panel2 hover:text-text"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/provider/new"
                className="mt-1 block rounded-lg bg-mint px-3 py-2 text-sm font-medium text-ink"
              >
                New sandbox
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
