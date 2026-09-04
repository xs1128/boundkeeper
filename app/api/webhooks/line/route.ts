import { after, NextResponse } from "next/server";
import { handleLineWebhook } from "@/src/adapters/line";

export const maxDuration = 60;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");
  const outcome = handleLineWebhook(rawBody, signature);

  if (outcome.work) {
    try {
      after(() => outcome.work);
    } catch {
      await outcome.work;
    }
  }

  return NextResponse.json(outcome.body, { status: outcome.status });
}
