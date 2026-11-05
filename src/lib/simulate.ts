import {
  getSandboxDetails,
  getScenarioWithSteps,
  saveRun,
} from "@/lib/store";
import type { RunMode, RunWithSteps } from "@/lib/types";

const MODES: Record<
  RunMode,
  { latencyFactor: number; errorAdd: number; chaos: number; label: string }
> = {
  normal: { latencyFactor: 1, errorAdd: 0, chaos: 0, label: "normal conditions" },
  stress: {
    latencyFactor: 1.7,
    errorAdd: 0.05,
    chaos: 0.35,
    label: "stress conditions",
  },
  chaos: {
    latencyFactor: 2.4,
    errorAdd: 0.12,
    chaos: 0.75,
    label: "chaos conditions",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function failureBody(status: number, stepName: string) {
  return JSON.stringify(
    {
      error: status === 503 ? "service_unavailable" : "internal_error",
      message:
        status === 503
          ? "The sandbox injected a transient outage on this dependency."
          : "The sandbox injected an unexpected failure while processing the request.",
      step: stepName,
      request_id: `req_${Math.random().toString(36).slice(2, 10)}`,
      retryable: true,
    },
    null,
    2
  );
}

export function runScenario(scenarioId: number, mode: RunMode = "normal"): RunWithSteps {
  const scenario = getScenarioWithSteps(scenarioId);
  if (!scenario) {
    throw new Error("Scenario not found");
  }
  if (scenario.steps.length === 0) {
    throw new Error("This scenario has no steps yet");
  }

  const sandbox = getSandboxDetails(scenario.sandboxId);
  if (!sandbox) {
    throw new Error("Sandbox not found");
  }

  const config = MODES[mode] ?? MODES.normal;
  const startedAt = new Date().toISOString();

  let totalLatency = 0;
  let stepsPassed = 0;
  let injectedFailures = 0;
  const usedEndpoints = new Set<number>();
  const simSteps: {
    position: number;
    name: string;
    method: string;
    path: string;
    requestBody: string;
    responseStatus: number;
    responseBody: string;
    latencyMs: number;
    passed: boolean;
    error: string;
  }[] = [];

  scenario.steps.forEach((step, index) => {
    const endpoint = step.endpoint;
    if (!endpoint) {
      simSteps.push({
        position: index,
        name: step.name,
        method: "?",
        path: "unresolved",
        requestBody: step.requestBody,
        responseStatus: 0,
        responseBody: "",
        latencyMs: 0,
        passed: false,
        error: "This step points at an endpoint that no longer exists.",
      });
      return;
    }

    usedEndpoints.add(endpoint.id);

    const effectiveError = clamp(
      endpoint.errorRate + config.errorAdd,
      0,
      0.6
    );
    const injected = Math.random() < effectiveError;
    if (injected) injectedFailures += 1;

    const jitter = 0.85 + Math.random() * 0.3;
    const retryPenalty = injected ? 280 + Math.random() * 620 : 0;
    const latency = Math.round(
      endpoint.latencyMs * config.latencyFactor * jitter + retryPenalty
    );
    const status = injected
      ? Math.random() < 0.55
        ? 500
        : 503
      : endpoint.statusCode;
    const body = injected
      ? failureBody(status, step.name)
      : endpoint.responseBody;

    const statusOk = status === step.expectedStatus;
    const containsOk =
      step.expectedContains.trim() === "" ||
      body.includes(step.expectedContains);

    let error = "";
    if (!statusOk) {
      error = `Expected HTTP ${step.expectedStatus}, received ${status}.`;
    } else if (!containsOk) {
      error = `Response did not contain the promised contract text: ${step.expectedContains}`;
    }

    const passed = statusOk && containsOk;
    if (passed) stepsPassed += 1;
    totalLatency += latency;

    simSteps.push({
      position: index,
      name: step.name,
      method: endpoint.method,
      path: endpoint.path,
      requestBody: step.requestBody,
      responseStatus: status,
      responseBody: body,
      latencyMs: latency,
      passed,
      error,
    });
  });

  const stepsTotal = scenario.steps.length;
  const avgLatencyMs = Math.round(totalLatency / stepsTotal);
  const passRate = stepsPassed / stepsTotal;
  const reliability = 1 - injectedFailures / stepsTotal;
  const coverage =
    sandbox.endpoints.length > 0
      ? usedEndpoints.size / sandbox.endpoints.length
      : 0;
  const readinessScore = Math.round(
    100 * (0.55 * passRate + 0.25 * reliability + 0.2 * coverage)
  );

  const summary =
    stepsPassed === stepsTotal
      ? `All ${stepsTotal} step${stepsTotal === 1 ? "" : "s"} matched the published contract under ${config.label}. Average response ${avgLatencyMs}ms across ${usedEndpoints.size} endpoint${usedEndpoints.size === 1 ? "" : "s"}.`
      : `${stepsTotal - stepsPassed} of ${stepsTotal} steps did not match the published contract under ${config.label}. Review the trace below to see exactly where the product diverged from the promise.`;

  return saveRun({
    sandbox,
    scenario,
    mode,
    chaos: config.chaos,
    startedAt,
    durationMs: totalLatency,
    stepsPassed,
    stepsTotal,
    avgLatencyMs,
    reliability,
    readinessScore,
    summary,
    steps: simSteps,
  });
}
