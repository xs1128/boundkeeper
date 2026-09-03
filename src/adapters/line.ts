import type { MessageAdapter } from "./types";

export class LineAdapterNotImplementedError extends Error {
  constructor() {
    super("LINE adapter is not implemented yet.");
    this.name = "LineAdapterNotImplementedError";
  }
}

export const lineAdapter: MessageAdapter = {
  id: "line",
  async receive() {
    throw new LineAdapterNotImplementedError();
  },
};
