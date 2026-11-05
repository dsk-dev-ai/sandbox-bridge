import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSandboxDetails } from "@/lib/store";
import { StudioEditor } from "@/components/studio-editor";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { id } = await params;
  const sandbox = getSandboxDetails(Number(id));
  return { title: sandbox ? `Edit · ${sandbox.name}` : "Sandbox not found" };
}

export default async function EditSandboxPage({
  params,
}: {
  params: PageParams;
}) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id)) notFound();

  const sandbox = getSandboxDetails(id);
  if (!sandbox) notFound();

  return <StudioEditor sandbox={sandbox} />;
}
