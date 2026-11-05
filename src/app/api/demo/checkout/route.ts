import { NextResponse } from "next/server";
import { asString, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

type DemoMode = "healthy" | "broken";

function resolveMode(value: unknown): DemoMode {
  return asString(value) === "broken" ? "broken" : "healthy";
}

async function handle(mode: DemoMode) {
  const requestId = `req_${crypto.randomUUID().slice(0, 8)}`;
  const started = Date.now();

  // Simulate a real network hop to a payment provider.
  await wait(280 + Math.random() * 320);
  const processedIn = Date.now() - started;

  if (mode === "broken") {
    return NextResponse.json(
      {
        error: {
          code: "PAYMENT_PROVIDER_UNAVAILABLE",
          message:
            "Upstream payment provider did not respond before the 2s timeout.",
          retryable: true,
        },
        request_id: requestId,
        processed_in_ms: processedIn,
      },
      {
        status: 503,
        headers: {
          "x-request-id": requestId,
          "retry-after": "10",
        },
      }
    );
  }

  return NextResponse.json(
    {
      status: "paid",
      order_id: "ord_1042",
      amount: 4999,
      currency: "usd",
      receipt_url: "https://sandbox.paypilot.dev/receipts/ord_1042",
      message: "Payment captured. Receipt queued for delivery.",
      request_id: requestId,
      processed_in_ms: processedIn,
    },
    {
      status: 200,
      headers: { "x-request-id": requestId },
    }
  );
}

export async function POST(request: Request) {
  const body = (await readJson(request)) ?? {};
  return handle(resolveMode(body.mode));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return handle(resolveMode(searchParams.get("mode")));
}
