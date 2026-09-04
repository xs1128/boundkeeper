import { z } from "zod";
import { analyzeResultSchema } from "./schemas/analyze-result";

export const CONVERSATION_SESSION_KEY = "labor-filter:conversation:v1";

const conversationSchema = z.object({
  text: z.string(),
  fixtureId: z.string(),
  completed: z.object({
    sourceText: z.string(),
    result: analyzeResultSchema,
  }).nullable(),
});

export type Conversation = z.infer<typeof conversationSchema>;

export const EMPTY_CONVERSATION: Conversation = { text: "", fixtureId: "", completed: null };

export function readConversation(): { conversation: Conversation; available: boolean } {
  try {
    const raw = sessionStorage.getItem(CONVERSATION_SESSION_KEY);
    if (!raw) return { conversation: EMPTY_CONVERSATION, available: true };
    try {
      const parsed = conversationSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return { conversation: parsed.data, available: true };
    } catch {
      // Invalid or outdated snapshots must not prevent opening the form.
    }
    sessionStorage.removeItem(CONVERSATION_SESSION_KEY);
    return { conversation: EMPTY_CONVERSATION, available: true };
  } catch {
    return { conversation: EMPTY_CONVERSATION, available: false };
  }
}

export function writeConversation(conversation: Conversation): boolean {
  try {
    if (!conversation.text && !conversation.fixtureId && !conversation.completed) {
      sessionStorage.removeItem(CONVERSATION_SESSION_KEY);
    } else {
      sessionStorage.setItem(CONVERSATION_SESSION_KEY, JSON.stringify(conversation));
    }
    return true;
  } catch {
    // Keep analysis usable when browser storage is blocked or full.
    return false;
  }
}
