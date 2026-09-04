import { defineConfig } from "vitest/config";

// Opt-in only: never included by the repository's default *.test.ts pattern.
export default defineConfig({
  test: { environment: "node", include: ["tests/analysis/model.live.ts"], testTimeout: 20000 },
});
