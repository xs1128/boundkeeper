import { plantedFixtures } from "@/src/analysis/fixtures/planted";

export function getFixtureOptions() {
  return plantedFixtures.map((fixture) => ({
    id: fixture.id,
    label: fixture.label,
    text: fixture.message,
  }));
}
