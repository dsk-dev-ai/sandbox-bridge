import { NextResponse } from "next/server";
import {
  asId,
  asNumber,
  asString,
  isValidJson,
  jsonError,
  readJson,
} from "@/lib/http";
import { createEndpoint, getSandboxById } from "@/lib/store";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const { id: raw } = await params;
  const sandboxId = asId(raw);
  if (!sandboxId) return jsonError("Invalid sandbox id.", 404);
  if (!getSandboxById(sandboxId)) {
    return jsonError("Sandbox not found.", 404);
  }

  const body = await readJson(request);
  if (!body) return jsonError("Send a JSON body.");

  const name = asString(body.name).trim();
  const apiPath = asString(body.path).trim();
  if (name.length < 2) return jsonError("Name this endpoint.");
  if (!apiPath.startsWith("/")) {
    return jsonError("Paths must start with /.");
  }

  const responseBody = asString(body.responseBody, "{}");
  if (!isValidJson(responseBody)) {
    return jsonError("The mock response must be valid JSON.");
  }

  const errorRate = Math.min(
    0.6,
    Math.max(0, asNumber(body.errorRate, 0))
  );

  const endpoint = createEndpoint(sandboxId, {
    name,
    method: asString(body.method, "GET").toUpperCase(),
    path: apiPath,
    description: asString(body.description),
    statusCode: Math.round(asNumber(body.statusCode, 200)),
    latencyMs: Math.max(0, Math.round(asNumber(body.latencyMs, 150))),
    errorRate,
    responseBody,
  });

  return NextResponse.json({ endpoint }, { status: 201 });
}
