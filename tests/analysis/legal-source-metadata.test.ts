import { describe, expect, it } from "vitest";
import { z } from "zod";
import corpus from "../../assets/legal/corpus.zh-TW.json";
import snapshot from "../../assets/legal/sources/moj-selected-2026-09-04.json";
import expansion from "../../assets/legal/sources/moj-expansion-2026-09-04.json";
import regulations from "../../assets/legal/sources/moj-regulations-2026-09-04.json";

const snapshots: Record<string, typeof snapshot> = {
  "sources/moj-selected-2026-09-04.json": snapshot,
  "sources/moj-expansion-2026-09-04.json": expansion,
  "sources/moj-regulations-2026-09-04.json": regulations,
};

const text = z.string().trim().min(1);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Expected a real calendar date");
const versionDate = z.union([day, z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)]);
const officialUrl = z.string().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && [
    "law.moj.gov.tw", "data.gov.tw", "www.mol.gov.tw", "www.osha.gov.tw",
  ].includes(url.hostname);
}, "Expected an official HTTPS source");
const categoryId = z.enum([
  "workplace_bullying", "illegal_overtime", "improper_transfer",
  "forced_resignation", "legal_management",
  "sexual_harassment", "gender_discrimination", "employment_discrimination",
  "leave_rights", "wage_violation", "retaliation", "unsafe_work",
]);
const recordSchema = z.object({
  id: text,
  sourceKind: z.enum(["statute", "regulation", "official_guidance"]),
  officialNameZh: text,
  articleOrSection: text,
  articleNumber: text.nullable(),
  categoryIds: z.array(categoryId).min(1),
  contentKind: z.literal("faithful_summary"),
  summaryZh: text,
  caveatsZh: z.array(text).min(1),
  canonicalUrl: officialUrl,
  publisherZh: text,
  dataProviderZh: text,
  lastVerified: day,
  version: z.object({
    label: text,
    date: versionDate,
    effectiveDate: day.nullable(),
    status: z.enum(["in_force_as_verified", "guidance_not_statute"]),
    evidenceUrl: officialUrl,
    notesZh: text,
  }),
  reuse: z.object({
    licenseId: z.literal("OGDL-Taiwan-1.0"),
    licenseUrl: z.literal("https://data.gov.tw/license"),
    declarationUrl: officialUrl,
    attributionZh: text,
    notesZh: text,
  }),
  evidence: z.object({
    file: text.nullable(),
    lawNameZh: text.nullable(),
    articleNumber: text.nullable(),
  }),
});

describe("official legal corpus metadata (offline)", () => {
  it("requires traceable metadata and honest date precision for every record", () => {
    expect(corpus.schemaVersion).toBe(1);
    expect(day.safeParse(corpus.verifiedAsOf).success).toBe(true);
    expect(corpus.records.length).toBeGreaterThan(0);
    for (const record of corpus.records) {
      expect(recordSchema.safeParse(record).success, record.id).toBe(true);
      expect(record.lastVerified <= corpus.verifiedAsOf, record.id).toBe(true);
      expect(record.version.date <= record.lastVerified, record.id).toBe(true);
      if (record.version.effectiveDate !== null) {
        expect(record.version.effectiveDate <= record.lastVerified, record.id).toBe(true);
      }
    }
  });

  it("rejects missing source metadata, impossible dates and unofficial hosts", () => {
    const record = corpus.records[0];
    for (const field of ["officialNameZh", "articleOrSection", "canonicalUrl", "publisherZh", "lastVerified", "version", "reuse"]) {
      const incomplete: Record<string, unknown> = { ...record };
      delete incomplete[field];
      expect(recordSchema.safeParse(incomplete).success, field).toBe(false);
    }
    expect(recordSchema.safeParse({ ...record, lastVerified: "2026-02-30" }).success).toBe(false);
    expect(recordSchema.safeParse({ ...record, canonicalUrl: "https://law.moj.gov.tw.example.com/law" }).success).toBe(false);
    expect(recordSchema.safeParse({ ...record, summaryZh: " " }).success).toBe(false);
  });

  it("covers every supported category without duplicate record ids or URLs", () => {
    expect(new Set(corpus.records.map((record) => record.id)).size).toBe(corpus.records.length);
    expect(new Set(corpus.records.map((record) => record.canonicalUrl)).size).toBe(corpus.records.length);
    const used = new Set(corpus.records.flatMap((record) => record.categoryIds));
    expect([...used].sort()).toEqual([...categoryId.options].sort());
    expect(Object.keys(corpus.categoryLabels).sort()).toEqual([...used].sort());
  });

  it("links every legal summary to the same law, article and version in the downloaded evidence", () => {
    for (const source of Object.values(snapshots)) {
      expect(source.archiveSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(source.xmlSha256).toMatch(/^[a-f0-9]{64}$/);
    }
    const linked = new Set<string>();
    for (const record of corpus.records.filter((item) => item.sourceKind !== "official_guidance")) {
      const source = snapshots[record.evidence.file!];
      expect(source, record.id).toBeDefined();
      const law = source.laws.find((item) => item.nameZh === record.officialNameZh);
      expect(law, record.id).toBeDefined();
      if (!law) throw new Error(`Missing evidence for ${record.id}`);
      expect(record.evidence.lawNameZh).toBe(law.nameZh);
      expect(record.version.date.replaceAll("-", "")).toBe(law.amendedDateRaw);
      expect(record.evidence.articleNumber).toBe(record.articleNumber);
      const article = law.articles.find((item) => item.articleNumber === record.articleNumber);
      expect(article?.textZh.trim().length, record.id).toBeGreaterThan(0);
      expect(record.version.status).toBe("in_force_as_verified");
      const canonical = new URL(record.canonicalUrl);
      expect(canonical.searchParams.get("pcode")).toBe(new URL(law.canonicalUrl).searchParams.get("pcode"));
      expect(canonical.searchParams.get("flno")).toBe(record.articleNumber);
      linked.add(`${law.nameZh}:${record.articleNumber}`);
    }
    expect(linked.size).toBe(Object.values(snapshots).reduce((sum, source) =>
      sum + source.laws.reduce((count, law) => count + law.articles.length, 0), 0));
  });

  it("distinguishes 2026 leave regulations from statutes and keeps their exceptions", () => {
    expect(corpus.records.filter((record) => record.sourceKind === "regulation")).toHaveLength(5);
    for (const id of ["leave-7", "leave-9", "leave-9-1"]) {
      expect(corpus.records.find((record) => record.id === id)?.version.effectiveDate).toBe("2026-01-01");
    }
    expect(corpus.records.find((record) => record.id === "leave-9-1")?.caveatsZh.join(" ")).toContain("不是全年病假上限");
    expect(corpus.records.find((record) => record.id === "leave-9")?.summaryZh).toContain("比例");
  });

  it("does not present official guidance as legislation or invent an effective date", () => {
    for (const record of corpus.records.filter((item) => item.sourceKind === "official_guidance")) {
      expect(record.version.status).toBe("guidance_not_statute");
      expect(record.version.effectiveDate).toBeNull();
      expect(record.articleNumber).toBeNull();
      expect(record.evidence.file).toBeNull();
    }
    expect(corpus.records.find((item) => item.id === "osha-bullying-handbook")?.version.date).toBe("2026-06");
  });

  it("keeps the verified bullying commencement date and serious single-event exception", () => {
    const record = corpus.records.find((item) => item.id === "osha-22-1");
    const law = snapshot.laws.find((item) => item.nameZh === "職業安全衛生法");
    expect(law?.effectiveDateRaw).toBe("20260701");
    expect(record?.version.effectiveDate).toBe("2026-07-01");
    expect(record?.summaryZh).toContain("情節重大者不以持續發生為必要");
    expect(record?.caveatsZh.join(" ")).toContain("單則文字僅能提供風險線索");
  });
});
