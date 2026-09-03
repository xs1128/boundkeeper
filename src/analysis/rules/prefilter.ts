export type RuleHint = {
  categoryId: string;
  reason: string;
};

export class RulePrefilterNotImplementedError extends Error {
  constructor() {
    super("Rule prefilter is not implemented yet.");
    this.name = "RulePrefilterNotImplementedError";
  }
}

export function rulePrefilter(_text: string): RuleHint[] {
  void _text;
  throw new RulePrefilterNotImplementedError();
}
