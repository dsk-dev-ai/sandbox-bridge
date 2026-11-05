import { NextResponse } from "next/server";
import { asString, jsonError, readJson } from "@/lib/http";
import { createSandbox, listSandboxes } from "@/lib/store";
import type { SandboxStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status: SandboxStatus | undefined =
    statusParam === "published" || statusParam === "draft"
      ? statusParam
      : undefined;

  const sandboxes = listSandboxes({
    status,
    industry: searchParams.get("industry") ?? undefined,
    search: searchParams.get("q") ?? undefined,
  });
  return NextResponse.json({ sandboxes });
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("Send a JSON body.");

  const name = asString(body.name).trim();
  if (name.length < 2) {
    return jsonError("Give the sandbox a name with at least 2 characters.");
  }

  const sandbox = createSandbox({
    name,
    tagline: asString(body.tagline),
    description: asString(body.description),
    providerName: asString(body.providerName, "Independent developer"),
    industry: asString(body.industry, "General"),
  });

  return NextResponse.json({ sandbox }, { status: 201 });
}
