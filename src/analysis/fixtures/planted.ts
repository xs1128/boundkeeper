import plantedMessages from "../../../assets/fixtures/planted-messages.zh-TW.json";

export type PlantedFixture = {
  id: string;
  label: string;
  message: string;
  expectedPrimaryCategory: string;
  minimumRiskLevel: "none" | "low" | "medium" | "high";
};

export const plantedFixtures = plantedMessages as PlantedFixture[];
