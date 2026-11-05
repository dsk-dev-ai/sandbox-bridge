import { NextResponse } from "next/server";
import { asId, jsonError } from "@/lib/http";
import { deleteEndpoint } from "@/lib/store";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const { id: raw } = await params;
  const id = asId(raw);
  if (!id) return jsonError("Invalid endpoint id.", 404);
  const sandboxId = deleteEndpoint(id);
  if (!sandboxId) return jsonError("Endpoint not found.", 404);
  return NextResponse.json({ ok: true });
}
