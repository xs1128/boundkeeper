import { describe, expect, it } from "vitest";
import { analyzeMessage } from "../../src/analysis/analyze-message";
import { CATEGORY_LABELS, legalRefFor, type CategoryId } from "../../src/analysis/legal-context";
import { postValidate } from "../../src/analysis/post-validate";
import { rulePrefilter } from "../../src/analysis/rules/prefilter";
import baseline from "../../assets/fixtures/sanitized-analysis-result.json";

function candidate(category: CategoryId, sources: string[]) {
  return {
    ...structuredClone(baseline),
    riskLevel: "medium",
    categories: [{ id: category, labelZh: CATEGORY_LABELS[category], confidence: "medium" }],
    legalRefs: sources.map(legalRefFor),
  };
}

describe("expanded labor-risk safeguards", () => {
  it.each([
    ["sexual_harassment", "用陪睡交換升遷和好考績。"],
    ["gender_discrimination", "你懷孕就不能升遷。"],
    ["employment_discrimination", "你太老了，能力再好也不用來。"],
    ["leave_rights", "請一天病假就扣全部全勤。"],
    ["wage_violation", "薪水預扣設備損壞賠償。"],
    ["retaliation", "幫同事申訴就給你降職。"],
    ["unsafe_work", "機台漏電也不准停工。"],
  ])("provides a contextual hint for %s", (category, message) => {
    expect(rulePrefilter(message).map((hint) => hint.categoryId)).toContain(category);
  });

  it("accepts a binding leave regulation as a legal basis", () => {
    const result = postValidate(candidate("leave_rights", ["leave-9-1"]), "今年只請一天普通病假，公司因此把我的考績調降。");
    expect(result.legalRefs[0].statute).toBe("勞工請假規則 第 9-1 條");
    expect(result.elementsNote).toContain("不是全年病假上限");
  });

  it.each([
    ["sexual_harassment", ["osha-22-1"]],
    ["gender_discrimination", ["lsa-24"]],
    ["leave_rights", ["mol-reasonable-management"]],
    ["retaliation", ["gewa-12"]],
  ] as Array<[CategoryId, string[]]>)("rejects irrelevant or nonbinding sources for %s", (category, sources) => {
    expect(() => postValidate(candidate(category, sources), "需要核對主管通知及實際事件脈絡。"))
      .toThrow();
  });

  it("requires a relevant legal basis for every risk in a mixed case", () => {
    const value = candidate("gender_discrimination", ["gewa-11", "leave-9-1"]);
    value.categories.push({ id: "leave_rights", labelZh: CATEGORY_LABELS.leave_rights, confidence: "medium" });
    expect(postValidate(value, "主管因懷孕逼我離職，並因今年第一次請病假降低考績。").categories).toHaveLength(2);
    value.legalRefs = [legalRefFor("gewa-11")];
    expect(() => postValidate(value, "主管因懷孕逼我離職，並因今年第一次請病假降低考績。"))
      .toThrow();
  });

  it.each(["已經構成性騷擾", "確定構成性別歧視", "已構成就業歧視"])("rejects verdict copy: %s", (verdict) => {
    expect(() => postValidate({ ...candidate("sexual_harassment", ["gewa-12"]), explanationZh: verdict }, "請確認主管提出交換條件的訊息內容。"))
      .toThrow();
  });

  it("keeps crisis routing ahead of sexual harassment analysis", async () => {
    const result = await analyzeMessage({ text: "主管性騷擾我，我不想活了。", mode: "fixture" });
    expect(result.categories[0].id).toBe("crisis");
    expect(result.legalRefs).toEqual([]);
  });
});
