"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, ArrowLeft, ArrowRight, Check, Flask } from "@/components/icons";

export default function NewSandboxPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/sandboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          tagline: form.get("tagline"),
          description: form.get("description"),
          providerName: form.get("providerName"),
          industry: form.get("industry"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not create the sandbox.");
      }
      router.push(`/provider/${payload.sandbox.id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/provider"
        className="inline-flex items-center gap-2 text-xs text-faint hover:text-mint"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Developer studio
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">
            New sandbox
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text">
            Describe the product you want to prove
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Start with the promise. You will add endpoints and customer scenarios
            next. Everything stays in draft until you publish.
          </p>

          <form onSubmit={handleSubmit} className="card mt-8 space-y-5 p-6">
            {error ? (
              <p className="flex items-start gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">
                <Alert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            ) : null}

            <div>
              <label className="label" htmlFor="name">
                Product / sandbox name
              </label>
              <input
                id="name"
                name="name"
                required
                minLength={2}
                placeholder="e.g. PayPilot Checkout API"
                className="input"
                autoFocus
              />
            </div>

            <div>
              <label className="label" htmlFor="tagline">
                One-line promise
              </label>
              <input
                id="tagline"
                name="tagline"
                placeholder="Card payments, refunds, and receipts in one predictable API."
                className="input"
              />
              <p className="mt-1.5 text-[11px] text-faint">
                Write the thing a customer would repeat to their boss.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="description">
                What does this sandbox let a customer prove?
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Explain the product, what is simulated, and what a successful run should demonstrate."
                className="input min-h-28 resize-y"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="providerName">
                  Provider name
                </label>
                <input
                  id="providerName"
                  name="providerName"
                  placeholder="Your team or company"
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="industry">
                  Industry
                </label>
                <input
                  id="industry"
                  name="industry"
                  list="industries"
                  placeholder="Fintech, Developer tools…"
                  className="input"
                />
                <datalist id="industries">
                  <option value="Fintech" />
                  <option value="Developer tools" />
                  <option value="Privacy & security" />
                  <option value="Logistics" />
                  <option value="Health" />
                  <option value="Commerce" />
                  <option value="AI & data" />
                </datalist>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <button type="submit" disabled={pending} className="btn-primary">
                {pending ? "Creating…" : "Create sandbox"}
                {!pending ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
              <Link href="/provider" className="btn-subtle">
                Cancel
              </Link>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Flask className="h-4 w-4 text-mint" />
              <p className="text-sm font-semibold text-text">What happens next</p>
            </div>
            <ol className="mt-4 space-y-4">
              {[
                {
                  title: "Add endpoints",
                  body: "Define the routes, mock responses, latency, and honest failure rates.",
                },
                {
                  title: "Write scenarios",
                  body: "Give a persona a goal and assert the contract step by step.",
                },
                {
                  title: "Publish",
                  body: "Your sandbox appears in the catalog for any customer to run.",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line2 bg-panel2 text-[10px] font-semibold text-mint">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-text">{step.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-line bg-panel/60 p-5">
            <p className="text-xs font-semibold text-text">A good sandbox is:</p>
            <ul className="mt-3 space-y-2 text-[11px] text-muted">
              {[
                "Runnable without a sales call",
                "Honest about latency and failure",
                "Written around a customer's goal",
                "Useful even when it fails",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-mint" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
