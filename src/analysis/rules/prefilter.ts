import type { CategoryId } from "../legal-context";

export type RuleHint = {
  categoryId: CategoryId;
  reason: string;
};

export function rulePrefilter(text: string): RuleHint[] {
  const hints: RuleHint[] = [];
  if (/(加班|下班|打卡|責任制|on\s*call|24\s*小時)/i.test(text)) {
    hints.push({ categoryId: "illegal_overtime", reason: "可能涉及工時或給付；須核對實際工作、班表、補休意願及例外制度。" });
  }
  if (/(調[動職任]|外派|搬到|改到.{0,12}(上班|工作))/.test(text)) {
    hints.push({ categoryId: "improper_transfer", reason: "可能涉及調動；須確認契約、經營必要、待遇及家庭生活利益。" });
  }
  if (/(自己離職|自願離職|辭職|離職書|資遣|開除|解僱|不用來上班)/.test(text)) {
    hints.push({ categoryId: "forced_resignation", reason: "須區分勞工真意、合意終止、資遣與懲戒解僱，不直接認定逼退。" });
  }
  if (/(廢物|白[痴癡]|沒用|羞辱|孤立|排擠|滾出去|笨蛋|丟臉)/.test(text)) {
    hints.push({ categoryId: "workplace_bullying", reason: "可能有不當言語；單則訊息不能確認霸凌，亦不能排除重大單次事件。" });
  }
  if (hints.length === 0 && /(績效|報告|品質|改善|期限|進度)/.test(text)) {
    hints.push({ categoryId: "legal_management", reason: "可能是一般管理；仍須檢查要求及時程是否合理，不能只因涉及績效就排除侵害。" });
  }
  return hints;
}
