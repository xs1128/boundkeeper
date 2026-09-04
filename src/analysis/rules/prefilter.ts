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
  if (/(性騷擾|性要求|陪睡|上床|胸部|摸.{0,4}(胸|臀)|色情|黃色笑話)/.test(text)) {
    hints.push({ categoryId: "sexual_harassment", reason: "核對工作關聯、性意味或交換條件；不套用霸凌持續性門檻，亦須排除教育、禁止或轉述語境。" });
  }
  if (/(懷孕|結婚|生育|育兒|性別|性傾向|同性戀|女生|女性|男生|男性)/.test(text)) {
    hints.push({ categoryId: "gender_discrimination", reason: "核對待遇差異是否出於性別、性傾向或婚孕；相關字詞本身不代表歧視。" });
  }
  if (/(年齡|太老|身心障礙|宗教|種族|星座|血型|身分證|身份證|保證金|隱私|病歷)/.test(text)) {
    hints.push({ categoryId: "employment_discrimination", reason: "核對歧視事由、留置證件或非就業所需資料；必要身分核對或資格查驗不當然違法。" });
  }
  if (/(請假|病假|事假|生理假|產假|產檢|育嬰|家庭照顧|哺乳|集乳|特休|例假|休息日|國定假日|全勤|不准休息|連上)/.test(text)) {
    hints.push({ categoryId: "leave_rights", reason: "核對假別、資格、休息安排及給薪；普通病假半薪與比例扣全勤須和不利處分區分。" });
  }
  if (/(扣薪|扣[款錢]|欠薪|薪水|工資|薪資|賠償|違約金|最低工資|全勤)/.test(text)) {
    hints.push({ categoryId: "wage_violation", reason: "核對給付日、扣款法源或合意及工資明細；依法代扣、按假別給薪與預扣賠償不同。" });
  }
  if (/(申訴|檢舉|作證|報復)/.test(text)) {
    hints.push({ categoryId: "retaliation", reason: "須有申訴或協助申訴與不利待遇的關聯；提供申訴管道、禁止報復的政策不是報復。" });
  }
  if (/(立即危險|漏電|瓦斯外洩|瓦斯味|安全帶|防護具|停工|退避|倒塌)/.test(text)) {
    hints.push({ categoryId: "unsafe_work", reason: "須核對是否有立即危險及被迫繼續作業；安全停工通知不當然是違規，先確認安全。" });
  }
  if (hints.length === 0 && /(績效|報告|品質|改善|期限|進度)/.test(text)) {
    hints.push({ categoryId: "legal_management", reason: "可能是一般管理；仍須檢查要求及時程是否合理，不能只因涉及績效就排除侵害。" });
  }
  return hints;
}
