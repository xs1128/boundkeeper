export class NormalizeNotImplementedError extends Error {
  constructor() {
    super("Message normalization is not implemented yet.");
    this.name = "NormalizeNotImplementedError";
  }
}

export function normalizeMessage(_text: string): never {
  void _text;
  throw new NormalizeNotImplementedError();
}
