import type { AnalyzeResult } from "./types";

export class PostValidateNotImplementedError extends Error {
  constructor() {
    super("Analysis post-validation is not implemented yet.");
    this.name = "PostValidateNotImplementedError";
  }
}

export function postValidate(_result: AnalyzeResult): never {
  void _result;
  throw new PostValidateNotImplementedError();
}
