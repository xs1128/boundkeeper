import plantedMessages from "../../../assets/fixtures/planted-messages.zh-TW.json";
import { z } from "zod";
import { CATEGORY_IDS, CATEGORY_LABELS, legalRefFor } from "../legal-context";
import { normalizeMessage } from "../normalize";
import type { AnalyzeResult } from "../types";

const riskLevel = z.enum(["none", "low", "medium", "high"]);
const fixtureSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  message: z.string().min(1).max(8000),
  expectedPrimaryCategory: z.enum(CATEGORY_IDS),
  minimumRiskLevel: riskLevel,
  result: z.object({
    riskLevel,
    legalSourceIds: z.array(z.string()).min(1),
    explanationZh: z.string().min(1),
    suggestedReplyZh: z.string().min(1),
    nextStepsZh: z.array(z.string().min(1)).min(1),
  }),
});
export type PlantedFixture = z.infer<typeof fixtureSchema>;
export const plantedFixtures = z.array(fixtureSchema).parse(plantedMessages);

export function matchPlantedFixture(text: string): AnalyzeResult | null {
  const fixture = plantedFixtures.find((item) => normalizeMessage(item.message) === text);
  if (!fixture) return null;
  return {
    riskLevel: fixture.result.riskLevel,
    categories: [{ id: fixture.expectedPrimaryCategory, labelZh: CATEGORY_LABELS[fixture.expectedPrimaryCategory], confidence: "medium" }],
    legalRefs: fixture.result.legalSourceIds.map(legalRefFor),
    explanationZh: fixture.result.explanationZh,
    suggestedReplyZh: fixture.result.suggestedReplyZh,
    nextStepsZh: [...fixture.result.nextStepsZh],
    disclaimers: [],
  };
}
