export class SafetyCheckNotImplementedError extends Error {
  constructor() {
    super("Crisis safety check is not implemented yet.");
    this.name = "SafetyCheckNotImplementedError";
  }
}

export function safetyCheck(_text: string): never {
  void _text;
  throw new SafetyCheckNotImplementedError();
}
