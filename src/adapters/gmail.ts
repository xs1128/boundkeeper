import type { MessageAdapter } from "./types";

export class GmailAdapterNotImplementedError extends Error {
  constructor() {
    super("Gmail adapter is not implemented yet.");
    this.name = "GmailAdapterNotImplementedError";
  }
}

export const gmailAdapter: MessageAdapter = {
  id: "gmail",
  async receive() {
    throw new GmailAdapterNotImplementedError();
  },
};
