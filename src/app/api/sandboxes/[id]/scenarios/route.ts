import { NextResponse } from "next/server";
import { asId, asString, jsonError, readJson } from "@/lib/http";
import { createScenario, getSandboxById } from "@/lib/store";

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
  if (name.length < 2) return jsonError("Name this scenario.");

  const scenario = createScenario(sandboxId, {
    name,
    description: asString(body.description),
    persona: asString(body.persona),
    goal: asString(body.goal),
  });

  return NextResponse.json({ scenario }, { status: 201 });
}
