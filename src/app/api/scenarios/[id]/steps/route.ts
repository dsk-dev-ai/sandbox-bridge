import { NextResponse } from "next/server";
import {
  asId,
  asNumber,
  asString,
  isValidJson,
  jsonError,
  readJson,
} from "@/lib/http";
import {
  addStep,
  getSandboxDetails,
  getScenarioWithSteps,
} from "@/lib/store";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const { id: raw } = await params;
  const scenarioId = asId(raw);
  if (!scenarioId) return jsonError("Invalid scenario id.", 404);

  const scenario = getScenarioWithSteps(scenarioId);
  if (!scenario) return jsonError("Scenario not found.", 404);

  const body = await readJson(request);
  if (!body) return jsonError("Send a JSON body.");

  const endpointId = Math.round(asNumber(body.endpointId, 0));
  const sandbox = getSandboxDetails(scenario.sandboxId);
  const endpoint = sandbox?.endpoints.find((item) => item.id === endpointId);
  if (!endpoint) {
    return jsonError("Choose an endpoint that belongs to this sandbox.");
  }

  const name = asString(body.name, endpoint.name).trim();
  if (name.length < 2) return jsonError("Name this step.");

  const requestBody = asString(body.requestBody, "{}");
  if (!isValidJson(requestBody)) {
    return jsonError("The request body must be valid JSON.");
  }

  const step = addStep(scenarioId, {
    endpointId,
    name,
    expectedStatus: Math.round(asNumber(body.expectedStatus, endpoint.statusCode)),
    expectedContains: asString(body.expectedContains),
    requestBody,
  });

  return NextResponse.json({ step }, { status: 201 });
}
