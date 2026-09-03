import type { AnalyzeResult } from "./types";

export class FormatResultNotImplementedError extends Error {
  constructor() {
    super("Result formatting is not implemented yet.");
    this.name = "FormatResultNotImplementedError";
  }
}

export function formatResult(_result: AnalyzeResult): never {
  void _result;
  throw new FormatResultNotImplementedError();
}
