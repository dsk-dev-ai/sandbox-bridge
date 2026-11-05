import { NextResponse } from "next/server";
import { asId, asString, jsonError, readJson } from "@/lib/http";
import {
  deleteSandbox,
  getSandboxDetails,
  updateSandbox,
} from "@/lib/store";
import type { SandboxStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id: raw } = await params;
  const id = asId(raw);
  if (!id) return jsonError("Invalid sandbox id.", 404);

  const sandbox = getSandboxDetails(id);
  if (!sandbox) return jsonError("Sandbox not found.", 404);
  return NextResponse.json({ sandbox });
}

export async function PATCH(request: Request, { params }: Context) {
  const { id: raw } = await params;
  const id = asId(raw);
  if (!id) return jsonError("Invalid sandbox id.", 404);

  const body = await readJson(request);
  if (!body) return jsonError("Send a JSON body.");

  const statusRaw = asString(body.status);
  const status: SandboxStatus | undefined =
    statusRaw === "published" || statusRaw === "draft" ? statusRaw : undefined;

  const sandbox = updateSandbox(id, {
    name: typeof body.name === "string" ? body.name.trim() : undefined,
    tagline: typeof body.tagline === "string" ? body.tagline : undefined,
    description:
      typeof body.description === "string" ? body.description : undefined,
    providerName:
      typeof body.providerName === "string" ? body.providerName : undefined,
    industry: typeof body.industry === "string" ? body.industry : undefined,
    version: typeof body.version === "string" ? body.version : undefined,
    status,
  });

  if (!sandbox) return jsonError("Sandbox not found.", 404);
  return NextResponse.json({ sandbox });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id: raw } = await params;
  const id = asId(raw);
  if (!id) return jsonError("Invalid sandbox id.", 404);

  deleteSandbox(id);
  return NextResponse.json({ ok: true });
}
