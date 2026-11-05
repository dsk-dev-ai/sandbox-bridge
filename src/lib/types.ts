export type SandboxStatus = "draft" | "published";
export type RunMode = "normal" | "stress" | "chaos";

export interface Sandbox {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  providerName: string;
  industry: string;
  status: SandboxStatus;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface Endpoint {
  id: number;
  sandboxId: number;
  name: string;
  method: string;
  path: string;
  description: string;
  statusCode: number;
  latencyMs: number;
  errorRate: number;
  responseBody: string;
  createdAt: string;
}

export interface Scenario {
  id: number;
  sandboxId: number;
  name: string;
  description: string;
  persona: string;
  goal: string;
  createdAt: string;
}

export interface ScenarioStep {
  id: number;
  scenarioId: number;
  endpointId: number;
  position: number;
  name: string;
  expectedStatus: number;
  expectedContains: string;
  requestBody: string;
}

export interface ScenarioWithSteps extends Scenario {
  steps: (ScenarioStep & { endpoint: Endpoint | null })[];
}

export interface SandboxWithDetails extends Sandbox {
  endpoints: Endpoint[];
  scenarios: ScenarioWithSteps[];
}

export interface RunStep {
  id: number;
  runId: number;
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
}

export interface Run {
  id: number;
  sandboxId: number;
  scenarioId: number;
  scenarioName: string;
  sandboxName: string;
  sandboxSlug: string;
  status: "passed" | "failed";
  mode: RunMode;
  chaos: number;
  startedAt: string;
  durationMs: number;
  stepsPassed: number;
  stepsTotal: number;
  avgLatencyMs: number;
  reliability: number;
  readinessScore: number;
  summary: string;
  steps?: RunStep[];
}

export interface RunWithSteps extends Run {
  steps: RunStep[];
}

export interface NewSandboxInput {
  name: string;
  tagline: string;
  description: string;
  providerName: string;
  industry: string;
}

export interface NewEndpointInput {
  name: string;
  method: string;
  path: string;
  description: string;
  statusCode: number;
  latencyMs: number;
  errorRate: number;
  responseBody: string;
}

export interface NewScenarioInput {
  name: string;
  description: string;
  persona: string;
  goal: string;
}

export interface NewStepInput {
  endpointId: number;
  name: string;
  expectedStatus: number;
  expectedContains: string;
  requestBody: string;
}

export interface CatalogStats {
  publishedSandboxes: number;
  scenarios: number;
  endpoints: number;
  runs: number;
  avgReadiness: number;
  passRate: number;
}
