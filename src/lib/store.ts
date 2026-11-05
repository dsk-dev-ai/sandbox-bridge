import { getDb } from "@/lib/db";
import type {
  CatalogStats,
  Endpoint,
  NewEndpointInput,
  NewSandboxInput,
  NewScenarioInput,
  NewStepInput,
  Run,
  RunMode,
  RunStep,
  RunWithSteps,
  Sandbox,
  SandboxStatus,
  SandboxWithDetails,
  Scenario,
  ScenarioStep,
  ScenarioWithSteps,
} from "@/lib/types";

type Row = Record<string, unknown>;

const text = (value: unknown): string =>
  typeof value === "string" ? value : String(value ?? "");
const number = (value: unknown): number =>
  typeof value === "number" ? value : Number(value ?? 0);

function rowToSandbox(row: Row): Sandbox {
  return {
    id: number(row.id),
    slug: text(row.slug),
    name: text(row.name),
    tagline: text(row.tagline),
    description: text(row.description),
    providerName: text(row.provider_name),
    industry: text(row.industry),
    status: text(row.status) as SandboxStatus,
    version: text(row.version),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function rowToEndpoint(row: Row): Endpoint {
  return {
    id: number(row.id),
    sandboxId: number(row.sandbox_id),
    name: text(row.name),
    method: text(row.method),
    path: text(row.path),
    description: text(row.description),
    statusCode: number(row.status_code),
    latencyMs: number(row.latency_ms),
    errorRate: number(row.error_rate),
    responseBody: text(row.response_body),
    createdAt: text(row.created_at),
  };
}

function rowToScenario(row: Row): Scenario {
  return {
    id: number(row.id),
    sandboxId: number(row.sandbox_id),
    name: text(row.name),
    description: text(row.description),
    persona: text(row.persona),
    goal: text(row.goal),
    createdAt: text(row.created_at),
  };
}

function rowToStep(row: Row): ScenarioStep {
  return {
    id: number(row.id),
    scenarioId: number(row.scenario_id),
    endpointId: number(row.endpoint_id),
    position: number(row.position),
    name: text(row.name),
    expectedStatus: number(row.expected_status),
    expectedContains: text(row.expected_contains),
    requestBody: text(row.request_body),
  };
}

function rowToRunStep(row: Row): RunStep {
  return {
    id: number(row.id),
    runId: number(row.run_id),
    position: number(row.position),
    name: text(row.name),
    method: text(row.method),
    path: text(row.path),
    requestBody: text(row.request_body),
    responseStatus: number(row.response_status),
    responseBody: text(row.response_body),
    latencyMs: number(row.latency_ms),
    passed: Boolean(number(row.passed)),
    error: text(row.error),
  };
}

function rowToRun(row: Row): Run {
  return {
    id: number(row.id),
    sandboxId: number(row.sandbox_id),
    scenarioId: number(row.scenario_id),
    scenarioName: text(row.scenario_name),
    sandboxName: text(row.sandbox_name),
    sandboxSlug: text(row.sandbox_slug),
    status: text(row.status) as Run["status"],
    mode: text(row.mode) as RunMode,
    chaos: number(row.chaos),
    startedAt: text(row.started_at),
    durationMs: number(row.duration_ms),
    stepsPassed: number(row.steps_passed),
    stepsTotal: number(row.steps_total),
    avgLatencyMs: number(row.avg_latency_ms),
    reliability: number(row.reliability),
    readinessScore: number(row.readiness_score),
    summary: text(row.summary),
  };
}

// ---------------------------------------------------------------------------
// Sandboxes
// ---------------------------------------------------------------------------

export function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "sandbox";
}

function uniqueSlug(name: string): string {
  const db = getDb();
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;
  const exists = db.prepare("SELECT 1 AS hit FROM sandboxes WHERE slug = ?");
  while (exists.get(candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

export function listSandboxes(options?: {
  status?: SandboxStatus;
  industry?: string;
  search?: string;
}): Sandbox[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (options?.status) {
    clauses.push("status = ?");
    params.push(options.status);
  }
  if (options?.industry && options.industry !== "All") {
    clauses.push("industry = ?");
    params.push(options.industry);
  }
  if (options?.search) {
    clauses.push("(name LIKE ? OR tagline LIKE ? OR provider_name LIKE ?)");
    const like = `%${options.search}%`;
    params.push(like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT * FROM sandboxes ${where} ORDER BY
        CASE status WHEN 'published' THEN 0 ELSE 1 END,
        updated_at DESC`
    )
    .all(...params) as Row[];
  return rows.map(rowToSandbox);
}

export function listIndustries(): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT DISTINCT industry FROM sandboxes WHERE status = 'published' ORDER BY industry"
    )
    .all() as Row[];
  return rows.map((row) => text(row.industry));
}

export function getSandboxById(id: number): Sandbox | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM sandboxes WHERE id = ?").get(id) as
    | Row
    | undefined;
  return row ? rowToSandbox(row) : null;
}

export function getSandboxBySlug(slug: string): Sandbox | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM sandboxes WHERE slug = ?")
    .get(slug) as Row | undefined;
  return row ? rowToSandbox(row) : null;
}

export function getSandboxDetails(
  identifier: number | string
): SandboxWithDetails | null {
  const db = getDb();
  const row =
    typeof identifier === "number"
      ? (db.prepare("SELECT * FROM sandboxes WHERE id = ?").get(identifier) as
          | Row
          | undefined)
      : (db
          .prepare("SELECT * FROM sandboxes WHERE slug = ?")
          .get(identifier) as Row | undefined);
  if (!row) return null;

  const sandbox = rowToSandbox(row);
  const endpointRows = db
    .prepare("SELECT * FROM endpoints WHERE sandbox_id = ? ORDER BY id")
    .all(sandbox.id) as Row[];
  const endpoints = endpointRows.map(rowToEndpoint);

  const scenarioRows = db
    .prepare("SELECT * FROM scenarios WHERE sandbox_id = ? ORDER BY id")
    .all(sandbox.id) as Row[];

  const scenarios: ScenarioWithSteps[] = scenarioRows.map((scenarioRow) => {
    const scenario = rowToScenario(scenarioRow);
    const stepRows = db
      .prepare(
        "SELECT * FROM scenario_steps WHERE scenario_id = ? ORDER BY position"
      )
      .all(scenario.id) as Row[];
    const steps = stepRows.map((stepRow) => {
      const step = rowToStep(stepRow);
      const endpoint =
        endpoints.find((item) => item.id === step.endpointId) ?? null;
      return { ...step, endpoint };
    });
    return { ...scenario, steps };
  });

  return { ...sandbox, endpoints, scenarios };
}

export function createSandbox(input: NewSandboxInput): Sandbox {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO sandboxes (slug, name, tagline, description, provider_name, industry, status, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', 'v0.1', ?, ?)`
    )
    .run(
      uniqueSlug(input.name),
      input.name.trim(),
      input.tagline.trim(),
      input.description.trim(),
      input.providerName.trim() || "Independent developer",
      input.industry.trim() || "General",
      now,
      now
    );
  return getSandboxById(Number(result.lastInsertRowid))!;
}

export function updateSandbox(
  id: number,
  patch: Partial<{
    name: string;
    tagline: string;
    description: string;
    providerName: string;
    industry: string;
    version: string;
    status: SandboxStatus;
  }>
): Sandbox | null {
  const db = getDb();
  const fields: string[] = [];
  const params: (string | number)[] = [];

  const map: Record<string, string> = {
    name: "name",
    tagline: "tagline",
    description: "description",
    providerName: "provider_name",
    industry: "industry",
    version: "version",
    status: "status",
  };

  for (const [key, column] of Object.entries(map)) {
    const value = (patch as Record<string, unknown>)[key];
    if (typeof value === "string") {
      fields.push(`${column} = ?`);
      params.push(value);
    }
  }

  if (fields.length === 0) return getSandboxById(id);

  fields.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(id);

  db.prepare(`UPDATE sandboxes SET ${fields.join(", ")} WHERE id = ?`).run(
    ...params
  );
  return getSandboxById(id);
}

export function touchSandbox(id: number) {
  const db = getDb();
  db.prepare("UPDATE sandboxes SET updated_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    id
  );
}

export function deleteSandbox(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM sandboxes WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export function createEndpoint(
  sandboxId: number,
  input: NewEndpointInput
): Endpoint {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO endpoints (sandbox_id, name, method, path, description, status_code, latency_ms, error_rate, response_body, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      sandboxId,
      input.name.trim(),
      input.method.toUpperCase(),
      input.path.trim(),
      input.description.trim(),
      input.statusCode,
      input.latencyMs,
      input.errorRate,
      input.responseBody,
      new Date().toISOString()
    );
  touchSandbox(sandboxId);
  const row = db
    .prepare("SELECT * FROM endpoints WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as Row;
  return rowToEndpoint(row);
}

export function deleteEndpoint(id: number): number | null {
  const db = getDb();
  const row = db
    .prepare("SELECT sandbox_id FROM endpoints WHERE id = ?")
    .get(id) as Row | undefined;
  if (!row) return null;
  db.prepare("DELETE FROM endpoints WHERE id = ?").run(id);
  touchSandbox(number(row.sandbox_id));
  return number(row.sandbox_id);
}

// ---------------------------------------------------------------------------
// Scenarios & steps
// ---------------------------------------------------------------------------

export function createScenario(
  sandboxId: number,
  input: NewScenarioInput
): Scenario {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO scenarios (sandbox_id, name, description, persona, goal, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      sandboxId,
      input.name.trim(),
      input.description.trim(),
      input.persona.trim(),
      input.goal.trim(),
      new Date().toISOString()
    );
  touchSandbox(sandboxId);
  const row = db
    .prepare("SELECT * FROM scenarios WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as Row;
  return rowToScenario(row);
}

export function getScenarioWithSteps(id: number): ScenarioWithSteps | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM scenarios WHERE id = ?").get(id) as
    | Row
    | undefined;
  if (!row) return null;
  const scenario = rowToScenario(row);
  const stepRows = db
    .prepare("SELECT * FROM scenario_steps WHERE scenario_id = ? ORDER BY position")
    .all(id) as Row[];

  const steps = stepRows.map((stepRow) => {
    const step = rowToStep(stepRow);
    const endpointRow = db
      .prepare("SELECT * FROM endpoints WHERE id = ?")
      .get(step.endpointId) as Row | undefined;
    return {
      ...step,
      endpoint: endpointRow ? rowToEndpoint(endpointRow) : null,
    };
  });

  return { ...scenario, steps };
}

export function deleteScenario(id: number) {
  const db = getDb();
  const row = db
    .prepare("SELECT sandbox_id FROM scenarios WHERE id = ?")
    .get(id) as Row | undefined;
  db.prepare("DELETE FROM scenarios WHERE id = ?").run(id);
  if (row) touchSandbox(number(row.sandbox_id));
}

export function addStep(scenarioId: number, input: NewStepInput): ScenarioStep {
  const db = getDb();
  const maxRow = db
    .prepare(
      "SELECT COALESCE(MAX(position), -1) AS max_position FROM scenario_steps WHERE scenario_id = ?"
    )
    .get(scenarioId) as Row;
  const position = number(maxRow.max_position) + 1;
  const result = db
    .prepare(
      `INSERT INTO scenario_steps (scenario_id, endpoint_id, position, name, expected_status, expected_contains, request_body)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      scenarioId,
      input.endpointId,
      position,
      input.name.trim(),
      input.expectedStatus,
      input.expectedContains,
      input.requestBody
    );
  const row = db
    .prepare("SELECT * FROM scenario_steps WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as Row;
  const scenarioRow = db
    .prepare("SELECT sandbox_id FROM scenarios WHERE id = ?")
    .get(scenarioId) as Row | undefined;
  if (scenarioRow) touchSandbox(number(scenarioRow.sandbox_id));
  return rowToStep(row);
}

export function deleteStep(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM scenario_steps WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

export function saveRun(input: {
  sandbox: Sandbox;
  scenario: Scenario;
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
  steps: {
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
  }[];
}): RunWithSteps {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO runs (sandbox_id, scenario_id, scenario_name, sandbox_name, sandbox_slug, status, mode, chaos, started_at, duration_ms, steps_passed, steps_total, avg_latency_ms, reliability, readiness_score, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.sandbox.id,
      input.scenario.id,
      input.scenario.name,
      input.sandbox.name,
      input.sandbox.slug,
      input.stepsPassed === input.stepsTotal && input.stepsTotal > 0
        ? "passed"
        : "failed",
      input.mode,
      input.chaos,
      input.startedAt,
      input.durationMs,
      input.stepsPassed,
      input.stepsTotal,
      input.avgLatencyMs,
      input.reliability,
      input.readinessScore,
      input.summary
    );

  const runId = Number(result.lastInsertRowid);
  const insertStep = db.prepare(
    `INSERT INTO run_steps (run_id, position, name, method, path, request_body, response_status, response_body, latency_ms, passed, error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const step of input.steps) {
    insertStep.run(
      runId,
      step.position,
      step.name,
      step.method,
      step.path,
      step.requestBody,
      step.responseStatus,
      step.responseBody,
      step.latencyMs,
      step.passed ? 1 : 0,
      step.error
    );
  }

  return getRun(runId)!;
}

export function getRun(id: number): RunWithSteps | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM runs WHERE id = ?").get(id) as
    | Row
    | undefined;
  if (!row) return null;
  const stepRows = db
    .prepare("SELECT * FROM run_steps WHERE run_id = ? ORDER BY position")
    .all(id) as Row[];
  return { ...rowToRun(row), steps: stepRows.map(rowToRunStep) };
}

export function listRuns(limit = 50): Run[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM runs ORDER BY started_at DESC LIMIT ?")
    .all(limit) as Row[];
  return rows.map(rowToRun);
}

export function listRunsForSandbox(sandboxId: number, limit = 20): Run[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM runs WHERE sandbox_id = ? ORDER BY started_at DESC LIMIT ?"
    )
    .all(sandboxId, limit) as Row[];
  return rows.map(rowToRun);
}

export function listRunsForScenario(scenarioId: number, limit = 10): Run[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM runs WHERE scenario_id = ? ORDER BY started_at DESC LIMIT ?"
    )
    .all(scenarioId, limit) as Row[];
  return rows.map(rowToRun);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getStats(): CatalogStats {
  const db = getDb();
  const published = db
    .prepare("SELECT COUNT(*) AS count FROM sandboxes WHERE status = 'published'")
    .get() as Row;
  const scenarios = db
    .prepare(
      "SELECT COUNT(*) AS count FROM scenarios WHERE sandbox_id IN (SELECT id FROM sandboxes WHERE status = 'published')"
    )
    .get() as Row;
  const endpoints = db
    .prepare(
      "SELECT COUNT(*) AS count FROM endpoints WHERE sandbox_id IN (SELECT id FROM sandboxes WHERE status = 'published')"
    )
    .get() as Row;
  const runsRow = db
    .prepare(
      "SELECT COUNT(*) AS count, COALESCE(AVG(readiness_score), 0) AS avg_score, COALESCE(AVG(CASE WHEN status = 'passed' THEN 1.0 ELSE 0 END), 0) AS pass_rate FROM runs"
    )
    .get() as Row;

  return {
    publishedSandboxes: number(published.count),
    scenarios: number(scenarios.count),
    endpoints: number(endpoints.count),
    runs: number(runsRow.count),
    avgReadiness: Math.round(number(runsRow.avg_score)),
    passRate: Math.round(number(runsRow.pass_rate) * 100),
  };
}

export function getLeaderboard(limit = 5): {
  sandbox: Sandbox;
  runs: number;
  readiness: number;
}[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT s.*, COUNT(r.id) AS run_count, COALESCE(AVG(r.readiness_score), 0) AS readiness
       FROM sandboxes s
       LEFT JOIN runs r ON r.sandbox_id = s.id
       WHERE s.status = 'published'
       GROUP BY s.id
       ORDER BY readiness DESC, run_count DESC
       LIMIT ?`
    )
    .all(limit) as Row[];
  return rows.map((row) => ({
    sandbox: rowToSandbox(row),
    runs: number(row.run_count),
    readiness: Math.round(number(row.readiness)),
  }));
}
