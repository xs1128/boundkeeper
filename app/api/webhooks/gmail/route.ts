import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: {
        code: "GMAIL_ADAPTER_NOT_IMPLEMENTED",
        message: "Gmail adapter is a stretch-goal placeholder.",
      },
    },
    { status: 501 },
  );
}
