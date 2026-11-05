"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import type { SandboxWithDetails } from "@/lib/types";
import {
  Alert,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Code,
  Flask,
  Layers,
  Plus,
  Shield,
  Trash,
  Users,
} from "@/components/icons";
import { MethodBadge, StatusPill } from "@/components/ui";
import { CopyLink } from "@/components/copy-link";
import { cn, timeAgo } from "@/lib/utils";

function readForm(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  const values: Record<string, string> = {};
  data.forEach((value, key) => {
    values[key] = String(value);
  });
  return values;
}

export function StudioEditor({ sandbox }: { sandbox: SandboxWithDetails }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<void>) {
    setPending(action);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed.");
    } finally {
      setPending(null);
    }
  }

  async function call(url: string, method: string, body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? "Request failed.");
    }
    return payload;
  }

  const isPublished = sandbox.status === "published";
  const canPublish =
    sandbox.endpoints.length > 0 && sandbox.scenarios.length > 0;

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    run("settings", async () => {
      await call(`/api/sandboxes/${sandbox.id}`, "PATCH", {
        name: values.name,
        tagline: values.tagline,
        description: values.description,
        providerName: values.providerName,
        industry: values.industry,
        version: values.version,
      });
      setNotice("Sandbox details updated.");
      router.refresh();
    });
  }

  function addEndpoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readForm(form);
    run("endpoint", async () => {
      await call(`/api/sandboxes/${sandbox.id}/endpoints`, "POST", {
        name: values.name,
        method: values.method,
        path: values.path,
        description: values.description,
        statusCode: Number(values.statusCode),
        latencyMs: Number(values.latencyMs),
        errorRate: Number(values.errorRatePercent) / 100,
        responseBody: values.responseBody,
      });
      form.reset();
      setNotice("Endpoint added to the contract.");
      router.refresh();
    });
  }

  function addScenario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readForm(form);
    run("scenario", async () => {
      await call(`/api/sandboxes/${sandbox.id}/scenarios`, "POST", {
        name: values.name,
        description: values.description,
        persona: values.persona,
        goal: values.goal,
      });
      form.reset();
      setNotice("Scenario created. Add steps next.");
      router.refresh();
    });
  }

  function addStep(
    event: FormEvent<HTMLFormElement>,
    scenarioId: number
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readForm(form);
    run(`step-${scenarioId}`, async () => {
      await call(`/api/scenarios/${scenarioId}/steps`, "POST", {
        endpointId: Number(values.endpointId),
        name: values.name,
        expectedStatus: Number(values.expectedStatus),
        expectedContains: values.expectedContains,
        requestBody: values.requestBody,
      });
      form.reset();
      setNotice("Step added to the scenario.");
      router.refresh();
    });
  }

  function togglePublish() {
    const next = isPublished ? "draft" : "published";
    run("publish", async () => {
      await call(`/api/sandboxes/${sandbox.id}`, "PATCH", { status: next });
      setNotice(
        next === "published"
          ? "Sandbox published to the customer catalog."
          : "Sandbox moved back to draft."
      );
      router.refresh();
    });
  }

  function removeSandbox() {
    if (
      !window.confirm(
        "Delete this sandbox, its endpoints, scenarios, and all proof runs? This cannot be undone."
      )
    ) {
      return;
    }
    run("delete", async () => {
      await call(`/api/sandboxes/${sandbox.id}`, "DELETE");
      router.push("/provider");
      router.refresh();
    });
  }

  function removeEndpoint(endpointId: number) {
    if (
      !window.confirm(
        "Delete this endpoint? Any scenario steps that use it will also be removed."
      )
    ) {
      return;
    }
    run(`delete-endpoint-${endpointId}`, async () => {
      await call(`/api/endpoints/${endpointId}`, "DELETE");
      setNotice("Endpoint removed.");
      router.refresh();
    });
  }

  function removeScenario(scenarioId: number) {
    if (!window.confirm("Delete this scenario and all of its steps?")) return;
    run(`delete-scenario-${scenarioId}`, async () => {
      await call(`/api/scenarios/${scenarioId}`, "DELETE");
      setNotice("Scenario removed.");
      router.refresh();
    });
  }

  function removeStep(stepId: number) {
    run(`delete-step-${stepId}`, async () => {
      await call(`/api/steps/${stepId}`, "DELETE");
      setNotice("Step removed.");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/provider"
        className="inline-flex items-center gap-2 text-xs text-faint hover:text-mint"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Developer studio
      </Link>

      <div className="mt-5 flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={sandbox.status} />
            <span className="chip">{sandbox.industry}</span>
            <span className="chip font-mono">{sandbox.version}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text">
            {sandbox.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            /sandbox/{sandbox.slug} · updated {timeAgo(sandbox.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sandbox/${sandbox.slug}`}
            className="btn-ghost px-3 py-2 text-xs"
          >
            Preview
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={togglePublish}
            disabled={pending === "publish" || (!isPublished && !canPublish)}
            className={cn(
              "px-3 py-2 text-xs",
              isPublished ? "btn-ghost" : "btn-primary"
            )}
            title={
              !canPublish && !isPublished
                ? "Add at least one endpoint and one scenario first"
                : undefined
            }
          >
            <Shield className="h-3.5 w-3.5" />
            {pending === "publish"
              ? "Saving…"
              : isPublished
                ? "Unpublish"
                : "Publish to catalog"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-5 flex items-start gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">
          <Alert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-5 flex items-start gap-2 rounded-lg border border-mint/30 bg-mint/10 px-3 py-2 text-xs text-mint">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {notice}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {/* Settings */}
          <section className="card p-6">
            <div className="flex items-center gap-2">
              <Flask className="h-4 w-4 text-mint" />
              <h2 className="text-sm font-semibold text-text">
                Sandbox details
              </h2>
            </div>
            <form onSubmit={saveSettings} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="settings-name">
                    Name
                  </label>
                  <input
                    id="settings-name"
                    name="name"
                    defaultValue={sandbox.name}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="settings-version">
                    Version
                  </label>
                  <input
                    id="settings-version"
                    name="version"
                    defaultValue={sandbox.version}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="settings-tagline">
                  Tagline
                </label>
                <input
                  id="settings-tagline"
                  name="tagline"
                  defaultValue={sandbox.tagline}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="settings-description">
                  Description
                </label>
                <textarea
                  id="settings-description"
                  name="description"
                  defaultValue={sandbox.description}
                  rows={4}
                  className="input min-h-24 resize-y"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="settings-provider">
                    Provider name
                  </label>
                  <input
                    id="settings-provider"
                    name="providerName"
                    defaultValue={sandbox.providerName}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="settings-industry">
                    Industry
                  </label>
                  <input
                    id="settings-industry"
                    name="industry"
                    defaultValue={sandbox.industry}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex justify-end border-t border-line pt-4">
                <button
                  type="submit"
                  disabled={pending === "settings"}
                  className="btn-primary px-3 py-2 text-xs"
                >
                  {pending === "settings" ? "Saving…" : "Save details"}
                </button>
              </div>
            </form>
          </section>

          {/* Endpoints */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-sky" />
                <h2 className="text-sm font-semibold text-text">
                  Endpoints
                </h2>
                <span className="chip">{sandbox.endpoints.length}</span>
              </div>
            </div>

            <div className="divide-y divide-line">
              {sandbox.endpoints.length === 0 ? (
                <p className="px-6 py-6 text-sm text-muted">
                  No endpoints yet. Add the routes a customer would call.
                </p>
              ) : (
                sandbox.endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <MethodBadge method={endpoint.method} />
                      <code className="font-mono text-sm text-text">
                        {endpoint.path}
                      </code>
                      <span className="min-w-0 flex-1 truncate text-xs text-faint">
                        {endpoint.name}
                      </span>
                      <span className="font-mono text-[11px] text-faint">
                        {endpoint.statusCode} · {endpoint.latencyMs}ms ·{" "}
                        {Math.round(endpoint.errorRate * 100)}% fail
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEndpoint(endpoint.id)}
                        disabled={pending === `delete-endpoint-${endpoint.id}`}
                        className="rounded-lg p-1.5 text-faint transition-colors hover:bg-bad/10 hover:text-bad"
                        aria-label={`Delete ${endpoint.name}`}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <details className="group mt-2">
                      <summary className="cursor-pointer list-none text-[10px] uppercase tracking-wider text-faint hover:text-muted [&::-webkit-details-marker]:hidden">
                        Description &amp; mock response
                      </summary>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <p className="text-xs leading-relaxed text-muted">
                          {endpoint.description || "No description."}
                        </p>
                        <pre className="max-h-40 overflow-auto rounded-lg border border-line bg-ink/40 p-2.5 font-mono text-[10px] leading-relaxed text-muted">
                          {endpoint.responseBody}
                        </pre>
                      </div>
                    </details>
                  </div>
                ))
              )}
            </div>

            <details className="group border-t border-line">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-6 py-3 text-xs text-muted hover:text-mint [&::-webkit-details-marker]:hidden">
                <Plus className="h-3.5 w-3.5" />
                Add endpoint
              </summary>
              <form
                onSubmit={addEndpoint}
                className="space-y-4 border-t border-line bg-ink/30 px-6 py-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="ep-name">
                      Name
                    </label>
                    <input
                      id="ep-name"
                      name="name"
                      required
                      placeholder="Create payment intent"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="ep-desc">
                      Description
                    </label>
                    <input
                      id="ep-desc"
                      name="description"
                      placeholder="What does this route promise?"
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                  <div>
                    <label className="label" htmlFor="ep-method">
                      Method
                    </label>
                    <select id="ep-method" name="method" className="select">
                      {["GET", "POST", "PATCH", "PUT", "DELETE"].map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="ep-path">
                      Path
                    </label>
                    <input
                      id="ep-path"
                      name="path"
                      required
                      placeholder="/v1/payment_intents"
                      className="input font-mono"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label" htmlFor="ep-status">
                      Status code
                    </label>
                    <input
                      id="ep-status"
                      name="statusCode"
                      type="number"
                      defaultValue={200}
                      min={100}
                      max={599}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="ep-latency">
                      Latency (ms)
                    </label>
                    <input
                      id="ep-latency"
                      name="latencyMs"
                      type="number"
                      defaultValue={150}
                      min={0}
                      step={10}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="ep-error">
                      Failure rate (%)
                    </label>
                    <input
                      id="ep-error"
                      name="errorRatePercent"
                      type="number"
                      defaultValue={1}
                      min={0}
                      max={60}
                      step={0.5}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="ep-body">
                    Mock response (JSON)
                  </label>
                  <textarea
                    id="ep-body"
                    name="responseBody"
                    defaultValue={'{\n  "ok": true\n}'}
                    rows={6}
                    className="textarea"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={pending === "endpoint"}
                    className="btn-primary px-3 py-2 text-xs"
                  >
                    {pending === "endpoint" ? "Adding…" : "Add endpoint"}
                  </button>
                </div>
              </form>
            </details>
          </section>

          {/* Scenarios */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-mint" />
                <h2 className="text-sm font-semibold text-text">Scenarios</h2>
                <span className="chip">{sandbox.scenarios.length}</span>
              </div>
            </div>

            <div className="divide-y divide-line">
              {sandbox.scenarios.length === 0 ? (
                <p className="px-6 py-6 text-sm text-muted">
                  No scenarios yet. A scenario is a persona with a goal and a chain
                  of asserted steps.
                </p>
              ) : (
                sandbox.scenarios.map((scenario) => (
                  <div key={scenario.id} className="px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-medium text-sky">
                          {scenario.persona || "Customer"}
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-text">
                          {scenario.name}
                        </h3>
                        <p className="mt-1 max-w-xl text-xs text-muted">
                          {scenario.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeScenario(scenario.id)}
                        disabled={pending === `delete-scenario-${scenario.id}`}
                        className="rounded-lg p-1.5 text-faint transition-colors hover:bg-bad/10 hover:text-bad"
                        aria-label={`Delete ${scenario.name}`}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <ol className="mt-4 space-y-2">
                      {scenario.steps.length === 0 ? (
                        <li className="rounded-lg border border-line bg-ink/30 px-3 py-2 text-xs text-faint">
                          No steps yet. Add the first assertion below.
                        </li>
                      ) : (
                        scenario.steps.map((step) => (
                          <li
                            key={step.id}
                            className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-ink/30 px-3 py-2"
                          >
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-line2 text-[9px] font-semibold text-muted">
                              {step.position + 1}
                            </span>
                            {step.endpoint ? (
                              <MethodBadge
                                method={step.endpoint.method}
                                className="min-w-10 px-1 py-0 text-[9px]"
                              />
                            ) : null}
                            <span className="min-w-0 flex-1 truncate text-xs text-text">
                              {step.name}
                            </span>
                            <span className="font-mono text-[10px] text-faint">
                              expects {step.expectedStatus}
                              {step.expectedContains
                                ? ` · "${step.expectedContains}"`
                                : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeStep(step.id)}
                              disabled={pending === `delete-step-${step.id}`}
                              className="rounded p-1 text-faint hover:text-bad"
                              aria-label={`Delete step ${step.name}`}
                            >
                              <Trash className="h-3 w-3" />
                            </button>
                          </li>
                        ))
                      )}
                    </ol>

                    <details className="group mt-3">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[11px] text-muted hover:text-mint [&::-webkit-details-marker]:hidden">
                        <Plus className="h-3 w-3" />
                        Add step
                      </summary>
                      {sandbox.endpoints.length === 0 ? (
                        <p className="mt-2 rounded-lg border border-warn/20 bg-warn/5 px-3 py-2 text-[11px] text-warn">
                          Add an endpoint first — steps call endpoints.
                        </p>
                      ) : (
                        <form
                          onSubmit={(event) => addStep(event, scenario.id)}
                          className="mt-3 space-y-3 rounded-lg border border-line bg-ink/30 p-4"
                        >
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="label">Endpoint</label>
                              <select
                                name="endpointId"
                                required
                                className="select"
                                defaultValue={sandbox.endpoints[0]?.id}
                              >
                                {sandbox.endpoints.map((endpoint) => (
                                  <option key={endpoint.id} value={endpoint.id}>
                                    {endpoint.method} {endpoint.path}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="label">Step name</label>
                              <input
                                name="name"
                                required
                                placeholder="Create the payment intent"
                                className="input"
                              />
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="label">Expected status</label>
                              <input
                                name="expectedStatus"
                                type="number"
                                defaultValue={200}
                                min={100}
                                max={599}
                                className="input"
                              />
                            </div>
                            <div>
                              <label className="label">
                                Response must contain
                              </label>
                              <input
                                name="expectedContains"
                                placeholder="requires_confirmation"
                                className="input font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="label">Request body (JSON)</label>
                            <textarea
                              name="requestBody"
                              defaultValue={"{\n  \n}"}
                              rows={4}
                              className="textarea"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={pending === `step-${scenario.id}`}
                              className="btn-primary px-3 py-2 text-xs"
                            >
                              {pending === `step-${scenario.id}`
                                ? "Adding…"
                                : "Add step"}
                            </button>
                          </div>
                        </form>
                      )}
                    </details>
                  </div>
                ))
              )}
            </div>

            <details className="group border-t border-line">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-6 py-3 text-xs text-muted hover:text-mint [&::-webkit-details-marker]:hidden">
                <Plus className="h-3.5 w-3.5" />
                Add scenario
              </summary>
              <form
                onSubmit={addScenario}
                className="space-y-4 border-t border-line bg-ink/30 px-6 py-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="sc-name">
                      Scenario name
                    </label>
                    <input
                      id="sc-name"
                      name="name"
                      required
                      placeholder="First-time customer checkout"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="sc-persona">
                      Persona
                    </label>
                    <input
                      id="sc-persona"
                      name="persona"
                      placeholder="Aisha — online shopper"
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="sc-goal">
                    Customer goal
                  </label>
                  <input
                    id="sc-goal"
                    name="goal"
                    placeholder="Pay for a cart and get a receipt."
                    className="input"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="sc-desc">
                    Description
                  </label>
                  <textarea
                    id="sc-desc"
                    name="description"
                    rows={3}
                    placeholder="What should this scenario prove?"
                    className="input min-h-20 resize-y"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={pending === "scenario"}
                    className="btn-primary px-3 py-2 text-xs"
                  >
                    {pending === "scenario" ? "Creating…" : "Create scenario"}
                  </button>
                </div>
              </form>
            </details>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-mint" />
              <p className="text-sm font-semibold text-text">Publication</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {isPublished
                ? "This sandbox is live in the catalog. Customers can run any scenario."
                : "This sandbox is a draft. Only people with the link can preview it."}
            </p>
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wider text-faint">
                Ready to publish
              </p>
              <ul className="mt-2 space-y-2 text-[11px]">
                <ChecklistItem
                  ok={sandbox.endpoints.length > 0}
                  label={`${sandbox.endpoints.length} endpoint${sandbox.endpoints.length === 1 ? "" : "s"}`}
                />
                <ChecklistItem
                  ok={sandbox.scenarios.length > 0}
                  label={`${sandbox.scenarios.length} scenario${sandbox.scenarios.length === 1 ? "" : "s"}`}
                />
                <ChecklistItem
                  ok={sandbox.scenarios.every(
                    (scenario) => scenario.steps.length > 0
                  )}
                  label="Every scenario has steps"
                />
              </ul>
            </div>
            <button
              type="button"
              onClick={togglePublish}
              disabled={pending === "publish" || (!isPublished && !canPublish)}
              className={cn(
                "mt-4 w-full px-3 py-2 text-xs",
                isPublished ? "btn-ghost" : "btn-primary"
              )}
            >
              {isPublished ? "Unpublish" : "Publish to catalog"}
            </button>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky" />
              <p className="text-sm font-semibold text-text">Share</p>
            </div>
            <p className="mt-2 text-xs text-muted">
              Send the preview link to a customer. They can run scenarios without
              a login in this demo.
            </p>
            <div className="mt-3 flex gap-2">
              <CopyLink
                path={`/sandbox/${sandbox.slug}`}
                label="Copy sandbox link"
                className="flex-1"
              />
              <Link
                href={`/sandbox/${sandbox.slug}`}
                className="btn-ghost px-2.5 py-2 text-xs"
                aria-label="Open sandbox"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-bad/20 bg-bad/5 p-5">
            <p className="text-sm font-semibold text-bad">Danger zone</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Deleting removes the sandbox, endpoints, scenarios, and every proof
              report generated against it.
            </p>
            <button
              type="button"
              onClick={removeSandbox}
              disabled={pending === "delete"}
              className="btn-danger mt-4 w-full px-3 py-2 text-xs"
            >
              <Trash className="h-3.5 w-3.5" />
              {pending === "delete" ? "Deleting…" : "Delete sandbox"}
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-panel/60 p-5">
            <p className="text-xs font-semibold text-text">Not sure what next?</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Add at least one endpoint and one scenario, then run it yourself from
              the preview page. If the proof is honest, publish it.
            </p>
            <Link
              href="/runs"
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-mint hover:underline"
            >
              See recent proof reports
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={cn(
          "grid h-4 w-4 place-items-center rounded-full",
          ok ? "bg-mint/15 text-mint" : "bg-line2 text-faint"
        )}
      >
        {ok ? <Check className="h-2.5 w-2.5" /> : null}
      </span>
      <span className={ok ? "text-muted" : "text-faint"}>{label}</span>
    </li>
  );
}
