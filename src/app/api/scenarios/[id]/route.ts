import { NextResponse } from "next/server";
import { asId, jsonError } from "@/lib/http";
import { deleteScenario } from "@/lib/store";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const { id: raw } = await params;
  const id = asId(raw);
  if (!id) return jsonError("Invalid scenario id.", 404);
  deleteScenario(id);
  return NextResponse.json({ ok: true });
}
