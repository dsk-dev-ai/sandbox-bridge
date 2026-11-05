"use client";

import { useState } from "react";
import { Check, Copy } from "@/components/icons";
import { cn } from "@/lib/utils";

export function CopyLink({
  path,
  label = "Copy link",
  className,
}: {
  path: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        new URL(path, window.location.origin).toString()
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn("btn-ghost px-3 py-2 text-xs", className)}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-mint" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
