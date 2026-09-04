import plantedMessages from "../../../assets/fixtures/planted-messages.zh-TW.json";

/** Browser-safe fixture choices; importing these does not load the analysis core. */
export const fixtureOptions: Array<{ id: string; label: string; text: string }> =
  plantedMessages.map(({ id, label, message }) => ({ id, label, text: message }));
