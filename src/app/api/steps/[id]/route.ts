import { NextResponse } from "next/server";
import { asId, jsonError } from "@/lib/http";
import { deleteStep } from "@/lib/store";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const { id: raw } = await params;
  const id = asId(raw);
  if (!id) return jsonError("Invalid step id.", 404);
  deleteStep(id);
  return NextResponse.json({ ok: true });
}
