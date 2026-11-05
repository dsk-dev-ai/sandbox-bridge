import { NextResponse } from "next/server";
import { asId, asString, jsonError, readJson } from "@/lib/http";
import { runScenario } from "@/lib/simulate";
import type { RunMode } from "@/lib/types";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const MODES: RunMode[] = ["normal", "stress", "chaos"];

export async function POST(request: Request, { params }: Context) {
  const { id: raw } = await params;
  const scenarioId = asId(raw);
  if (!scenarioId) return jsonError("Invalid scenario id.", 404);

  const body = (await readJson(request)) ?? {};
  const requested = asString(body.mode, "normal") as RunMode;
  const mode: RunMode = MODES.includes(requested) ? requested : "normal";

  try {
    const run = runScenario(scenarioId, mode);
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The simulation failed.";
    return jsonError(message, 400);
  }
}
