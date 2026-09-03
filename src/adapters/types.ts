import type { AnalyzeResult } from "@/src/analysis/types";

export type AdapterMessage = {
  text: string;
  metadata: Record<string, string>;
};

export interface MessageAdapter {
  id: "web" | "line" | "gmail";
  receive(raw: unknown): Promise<AdapterMessage>;
  reply?(
    payload: AnalyzeResult,
    metadata: Record<string, string>,
  ): Promise<void>;
}
