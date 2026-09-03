import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: {
        code: "LINE_ADAPTER_NOT_IMPLEMENTED",
        message: "LINE adapter is a stretch-goal placeholder.",
      },
    },
    { status: 501 },
  );
}
