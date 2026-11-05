export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function timeAgo(iso: string): string {
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return "—";
  const seconds = Math.max(1, Math.round((Date.now() - date) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function prettyJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function readinessTone(score: number): {
  label: string;
  text: string;
  bg: string;
  border: string;
  bar: string;
} {
  if (score >= 85) {
    return {
      label: "Production-ready",
      text: "text-mint",
      bg: "bg-mint/10",
      border: "border-mint/30",
      bar: "bg-mint",
    };
  }
  if (score >= 65) {
    return {
      label: "Needs hardening",
      text: "text-warn",
      bg: "bg-warn/10",
      border: "border-warn/30",
      bar: "bg-warn",
    };
  }
  return {
    label: "Not ready",
    text: "text-bad",
    bg: "bg-bad/10",
    border: "border-bad/30",
    bar: "bg-bad",
  };
}

export function methodTone(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "text-sky border-sky/30 bg-sky/10";
    case "POST":
      return "text-mint border-mint/30 bg-mint/10";
    case "PATCH":
    case "PUT":
      return "text-warn border-warn/30 bg-warn/10";
    case "DELETE":
      return "text-bad border-bad/30 bg-bad/10";
    default:
      return "text-muted border-line2 bg-panel2";
  }
}
