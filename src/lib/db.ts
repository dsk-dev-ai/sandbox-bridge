import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

type GlobalWithDb = typeof globalThis & {
  __provingGroundDb?: DatabaseSync;
};

const globalWithDb = globalThis as GlobalWithDb;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sandboxes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  provider_name TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'draft',
  version TEXT NOT NULL DEFAULT 'v0.1',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS endpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sandbox_id INTEGER NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  path TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status_code INTEGER NOT NULL DEFAULT 200,
  latency_ms INTEGER NOT NULL DEFAULT 150,
  error_rate REAL NOT NULL DEFAULT 0,
  response_body TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sandbox_id INTEGER NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  persona TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scenario_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  endpoint_id INTEGER NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  expected_status INTEGER NOT NULL DEFAULT 200,
  expected_contains TEXT NOT NULL DEFAULT '',
  request_body TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sandbox_id INTEGER NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  scenario_id INTEGER NOT NULL,
  scenario_name TEXT NOT NULL,
  sandbox_name TEXT NOT NULL,
  sandbox_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'normal',
  chaos REAL NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  steps_passed INTEGER NOT NULL DEFAULT 0,
  steps_total INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms INTEGER NOT NULL DEFAULT 0,
  reliability REAL NOT NULL DEFAULT 1,
  readiness_score INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS run_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  request_body TEXT NOT NULL DEFAULT '{}',
  response_status INTEGER NOT NULL DEFAULT 0,
  response_body TEXT NOT NULL DEFAULT '',
  latency_ms INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  error TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS demo_alerts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'checkout',
  status_code INTEGER NOT NULL DEFAULT 0,
  error_code TEXT NOT NULL DEFAULT '',
  request_id TEXT NOT NULL DEFAULT '',
  recipient TEXT NOT NULL DEFAULT '',
  from_email TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  email_status TEXT NOT NULL DEFAULT 'queued',
  email_error TEXT NOT NULL DEFAULT '',
  email_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_endpoints_sandbox ON endpoints(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_sandbox ON scenarios(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_steps_scenario ON scenario_steps(scenario_id);
CREATE INDEX IF NOT EXISTS idx_runs_sandbox ON runs(sandbox_id);
CREATE INDEX IF NOT EXISTS idx_run_steps_run ON run_steps(run_id);
CREATE INDEX IF NOT EXISTS idx_demo_alerts_created ON demo_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_alerts_kind ON demo_alerts(kind, resolved_at);
`;

function openDb(): DatabaseSync {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "proving-ground.db"));
  db.exec(SCHEMA);
  seedIfEmpty(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalWithDb.__provingGroundDb) {
    globalWithDb.__provingGroundDb = openDb();
  }
  return globalWithDb.__provingGroundDb;
}

function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) AS count FROM sandboxes").get() as
    | { count: number }
    | undefined;
  if (row && Number(row.count) > 0) return;

  const now = new Date().toISOString();

  const insertSandbox = db.prepare(
    `INSERT INTO sandboxes (slug, name, tagline, description, provider_name, industry, status, version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertEndpoint = db.prepare(
    `INSERT INTO endpoints (sandbox_id, name, method, path, description, status_code, latency_ms, error_rate, response_body, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertScenario = db.prepare(
    `INSERT INTO scenarios (sandbox_id, name, description, persona, goal, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertStep = db.prepare(
    `INSERT INTO scenario_steps (scenario_id, endpoint_id, position, name, expected_status, expected_contains, request_body)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const sandbox = (
    slug: string,
    name: string,
    tagline: string,
    description: string,
    providerName: string,
    industry: string,
    status: "draft" | "published",
    version: string
  ): number => {
    const result = insertSandbox.run(
      slug,
      name,
      tagline,
      description,
      providerName,
      industry,
      status,
      version,
      now,
      now
    );
    return Number(result.lastInsertRowid);
  };

  const endpoint = (
    sandboxId: number,
    name: string,
    method: string,
    apiPath: string,
    description: string,
    statusCode: number,
    latencyMs: number,
    errorRate: number,
    response: unknown
  ): number => {
    const result = insertEndpoint.run(
      sandboxId,
      name,
      method,
      apiPath,
      description,
      statusCode,
      latencyMs,
      errorRate,
      JSON.stringify(response, null, 2),
      now
    );
    return Number(result.lastInsertRowid);
  };

  const scenario = (
    sandboxId: number,
    name: string,
    description: string,
    persona: string,
    goal: string
  ): number => {
    const result = insertScenario.run(
      sandboxId,
      name,
      description,
      persona,
      goal,
      now
    );
    return Number(result.lastInsertRowid);
  };

  const step = (
    scenarioId: number,
    endpointId: number,
    position: number,
    name: string,
    expectedStatus: number,
    expectedContains: string,
    requestBody: unknown
  ) => {
    insertStep.run(
      scenarioId,
      endpointId,
      position,
      name,
      expectedStatus,
      expectedContains,
      JSON.stringify(requestBody, null, 2)
    );
  };

  // ---------------------------------------------------------------------------
  // PayPilot — fintech
  // ---------------------------------------------------------------------------
  const paypilot = sandbox(
    "paypilot-checkout",
    "PayPilot Checkout API",
    "Card payments, refunds, and receipts in one predictable API.",
    "PayPilot is a payments API for product teams. This sandbox mirrors the production contract: create a payment intent, confirm a card, retrieve state, and issue refunds. Use it to prove your checkout flow end to end before you move a single real dollar.",
    "PayPilot Labs",
    "Fintech",
    "published",
    "v1.4"
  );

  const ppCreate = endpoint(
    paypilot,
    "Create payment intent",
    "POST",
    "/v1/payment_intents",
    "Creates a payment intent for a cart. Returns the status the client must confirm.",
    201,
    180,
    0.01,
    {
      id: "pi_9f2c7a",
      amount: 4999,
      currency: "usd",
      status: "requires_confirmation",
      customer: "cus_marco",
      next_action: "confirm_payment_intent",
    }
  );

  const ppConfirm = endpoint(
    paypilot,
    "Confirm payment",
    "POST",
    "/v1/payment_intents/{id}/confirm",
    "Confirms the intent with a payment method. Returns the final charge state and receipt.",
    200,
    240,
    0.02,
    {
      id: "pi_9f2c7a",
      status: "succeeded",
      amount: 4999,
      currency: "usd",
      receipt_url: "https://sandbox.paypilot.dev/receipts/pi_9f2c7a",
      payment_method: "pm_card_visa",
    }
  );

  const ppRetrieve = endpoint(
    paypilot,
    "Retrieve payment",
    "GET",
    "/v1/payment_intents/{id}",
    "Reads current payment state. Safe to poll while the client renders a receipt.",
    200,
    90,
    0.005,
    {
      id: "pi_9f2c7a",
      status: "succeeded",
      amount: 4999,
      currency: "usd",
      customer: "cus_marco",
      refunded: false,
    }
  );

  const ppRefund = endpoint(
    paypilot,
    "Create refund",
    "POST",
    "/v1/refunds",
    "Refunds a captured payment and returns the expected arrival window.",
    201,
    210,
    0.01,
    {
      id: "re_31b0",
      payment_intent: "pi_9f2c7a",
      amount: 4999,
      status: "refunded",
      arrival: "3-5 business days",
    }
  );

  const ppCheckout = scenario(
    paypilot,
    "First-time customer checkout",
    "A shopper pays with a saved card and receives a receipt. This is the golden path every integration must pass.",
    "Aisha — online shopper",
    "Pay for a cart and receive a verifiable receipt without leaving the storefront."
  );
  step(ppCheckout, ppCreate, 0, "Create the payment intent", 201, "requires_confirmation", {
    amount: 4999,
    currency: "usd",
    customer: "cus_marco",
  });
  step(ppCheckout, ppConfirm, 1, "Confirm the card payment", 200, '"status": "succeeded"', {
    payment_intent: "pi_9f2c7a",
    payment_method: "pm_card_visa",
  });
  step(ppCheckout, ppRetrieve, 2, "Render the receipt", 200, '"refunded": false', {
    payment_intent: "pi_9f2c7a",
  });

  const ppRefundScenario = scenario(
    paypilot,
    "Refund a completed order",
    "Support refunds an order after checkout and confirms the money is on its way back.",
    "Marco — support agent",
    "Refund a captured payment and give the customer a clear arrival window."
  );
  step(ppRefundScenario, ppRetrieve, 0, "Verify the payment succeeded", 200, '"status": "succeeded"', {
    payment_intent: "pi_9f2c7a",
  });
  step(ppRefundScenario, ppRefund, 1, "Issue the refund", 201, '"status": "refunded"', {
    payment_intent: "pi_9f2c7a",
    amount: 4999,
  });

  // ---------------------------------------------------------------------------
  // SignalOps — devtools
  // ---------------------------------------------------------------------------
  const signalops = sandbox(
    "signalops-monitoring",
    "SignalOps Uptime Monitoring",
    "Know your API is down before your customers do.",
    "SignalOps watches endpoints from multiple regions, opens incidents, and alerts the on-call engineer. This sandbox lets you run the full monitoring loop — create a monitor, read a status, fire a webhook, and acknowledge an incident — without touching production traffic.",
    "SignalOps",
    "Developer tools",
    "published",
    "v2.1"
  );

  const soCreate = endpoint(
    signalops,
    "Create monitor",
    "POST",
    "/v1/monitors",
    "Registers a URL to watch from the configured regions.",
    201,
    160,
    0.01,
    {
      id: "mon_7c1",
      name: "checkout-api",
      url: "https://api.example.com/health",
      interval_seconds: 60,
      regions: ["us-east", "eu-west"],
      state: "active",
    }
  );

  const soStatus = endpoint(
    signalops,
    "Read monitor status",
    "GET",
    "/v1/monitors/{id}/status",
    "Returns the latest health check, 24h uptime, and observed latency.",
    200,
    80,
    0.01,
    {
      monitor_id: "mon_7c1",
      state: "up",
      uptime_24h: 99.98,
      last_checked: "2026-11-05T09:41:00Z",
      latency_ms: 182,
    }
  );

  const soAck = endpoint(
    signalops,
    "Acknowledge incident",
    "POST",
    "/v1/incidents/{id}/ack",
    "Marks an open incident as acknowledged so escalation can pause.",
    200,
    120,
    0.02,
    {
      incident_id: "inc_221",
      status: "acknowledged",
      acknowledged_by: "dana@example.com",
      next_step: "resolve",
    }
  );

  const soWebhook = endpoint(
    signalops,
    "Test alert webhook",
    "POST",
    "/v1/webhooks/test",
    "Delivers a signed test event to the on-call webhook and reports delivery.",
    200,
    300,
    0.04,
    {
      delivery_id: "wh_88f",
      target: "https://hooks.example.com/oncall",
      delivered: true,
      attempts: 1,
      signature: "sha256=8f2c...",
    }
  );

  const soWatch = scenario(
    signalops,
    "Watch a checkout API for a day",
    "A platform engineer registers the checkout service, then reads a healthy status with uptime evidence.",
    "Dana — platform engineer",
    "Confirm the deployment is being watched and healthy before the Friday launch."
  );
  step(soWatch, soCreate, 0, "Register the monitor", 201, '"state": "active"', {
    url: "https://api.example.com/health",
    interval_seconds: 60,
  });
  step(soWatch, soStatus, 1, "Read the latest status", 200, "99.98", {
    monitor_id: "mon_7c1",
  });

  const soAlert = scenario(
    signalops,
    "Alert the on-call engineer",
    "The monitoring loop opens an incident, delivers the webhook, and records an acknowledgment.",
    "Ravi — on-call engineer",
    "Prove that a failure reaches a human within one minute."
  );
  step(soAlert, soCreate, 0, "Register the monitor", 201, '"state": "active"', {
    url: "https://api.example.com/health",
  });
  step(soAlert, soWebhook, 1, "Deliver the alert", 200, '"delivered": true', {
    event: "monitor.down",
    monitor_id: "mon_7c1",
  });
  step(soAlert, soAck, 2, "Acknowledge the incident", 200, '"status": "acknowledged"', {
    incident_id: "inc_221",
    by: "dana@example.com",
  });

  // ---------------------------------------------------------------------------
  // ErasureProof — privacy
  // ---------------------------------------------------------------------------
  const erasure = sandbox(
    "erasureproof-audit",
    "ErasureProof Deletion Audit",
    "Prove personal data is actually gone — not just marked deleted.",
    "ErasureProof audits databases, logs, exports, search indexes, and backups after a deletion request. This sandbox demonstrates the evidence trail a privacy team needs: a deletion request, a full audit, and a signed verdict. One scenario intentionally exposes a known backup-restore risk.",
    "ErasureProof",
    "Privacy & security",
    "published",
    "v0.9"
  );

  const epCreate = endpoint(
    erasure,
    "Create deletion request",
    "POST",
    "/v1/deletion-requests",
    "Records an authorized deletion request and the systems it must cover.",
    201,
    220,
    0.01,
    {
      request_id: "del_5501",
      subject: "user_9281",
      status: "received",
      scope: [
        "database",
        "logs",
        "support_attachments",
        "exports",
        "search_index",
        "backups",
      ],
      sla_hours: 72,
    }
  );

  const epAudit = endpoint(
    erasure,
    "Run deletion audit",
    "POST",
    "/v1/deletion-requests/{id}/audit",
    "Scans every system in scope and counts remaining artifacts.",
    200,
    640,
    0.02,
    {
      request_id: "del_5501",
      audit_status: "finished",
      systems_checked: 14,
      remaining_artifacts: 0,
      recreation_risk: "low",
      evidence_hash: "sha256:9a1f...",
    }
  );

  const epReport = endpoint(
    erasure,
    "Get signed report",
    "GET",
    "/v1/deletion-requests/{id}/report",
    "Returns the signed verdict, remaining artifacts, and remediation steps.",
    200,
    300,
    0.01,
    {
      request_id: "del_5501",
      verdict: "COMPLETE",
      remaining: [],
      restore_risk: "Scheduled backup restore may reintroduce data within 30 days.",
      remediation: ["purge backup snapshots", "verify sync queue"],
      signed_by: "erasureproof-agent",
    }
  );

  const epProve = scenario(
    erasure,
    "Prove customer data is gone",
    "Privacy counsel creates a deletion request, runs the audit, and collects a signed report for the data subject.",
    "Nadia — privacy counsel",
    "Close a deletion ticket with evidence a regulator will accept."
  );
  step(epProve, epCreate, 0, "Open the deletion request", 201, '"status": "received"', {
    subject: "user_9281",
    reason: "gdpr_erasure",
  });
  step(epProve, epAudit, 1, "Audit every system in scope", 200, '"remaining_artifacts": 0', {
    request_id: "del_5501",
  });
  step(epProve, epReport, 2, "Collect the signed verdict", 200, '"verdict": "COMPLETE"', {
    request_id: "del_5501",
  });

  const epRisk = scenario(
    erasure,
    "Catch a backup restore (known risk)",
    "This scenario is designed to fail today. The audit says COMPLETE, but the report admits a backup restore can reintroduce data. Use the failing report to show exactly what must be fixed before launch.",
    "Sam — security engineer",
    "Verify that 'deleted' really survives the 30-day backup window."
  );
  step(epRisk, epCreate, 0, "Open the deletion request", 201, '"status": "received"', {
    subject: "user_9281",
    reason: "gdpr_erasure",
  });
  step(epRisk, epAudit, 1, "Audit every system in scope", 200, '"audit_status": "finished"', {
    request_id: "del_5501",
  });
  step(epRisk, epReport, 2, "Require an INCOMPLETE verdict", 200, '"verdict": "INCOMPLETE"', {
    request_id: "del_5501",
  });

  // ---------------------------------------------------------------------------
  // Atlas — draft logistics sandbox
  // ---------------------------------------------------------------------------
  const atlas = sandbox(
    "atlas-logistics",
    "Atlas Logistics Sandbox",
    "Book a parcel and follow it across the network.",
    "Atlas is a logistics API for marketplaces. This sandbox is still in draft while the tracking contract is being finalised.",
    "Atlas Freight",
    "Logistics",
    "draft",
    "v0.2"
  );

  const atCreate = endpoint(
    atlas,
    "Create shipment",
    "POST",
    "/v1/shipments",
    "Books a parcel and returns a tracking number.",
    201,
    260,
    0.02,
    {
      shipment_id: "shp_120",
      status: "created",
      tracking_number: "ATL-4481-9920",
    }
  );

  const atTrack = endpoint(
    atlas,
    "Track shipment",
    "GET",
    "/v1/shipments/{id}/track",
    "Returns the latest scan event and estimated arrival.",
    200,
    140,
    0.01,
    {
      shipment_id: "shp_120",
      status: "in_transit",
      eta: "2026-11-08T18:00:00Z",
      last_scan: "Memphis hub",
    }
  );

  const atScenario = scenario(
    atlas,
    "Book and track a parcel",
    "A merchant books a parcel and shows the buyer a live ETA.",
    "Leo — marketplace operator",
    "Give buyers a trustworthy delivery promise at checkout."
  );
  step(atScenario, atCreate, 0, "Book the shipment", 201, '"status": "created"', {
    weight_kg: 1.2,
    destination: "Austin, TX",
  });
  step(atScenario, atTrack, 1, "Show the tracking ETA", 200, '"status": "in_transit"', {
    shipment_id: "shp_120",
  });
}
