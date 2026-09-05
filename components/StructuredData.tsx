import { siteUrl as resolveSiteUrl } from "@/app/site-url";

const siteUrl = resolveSiteUrl();

const faqItems = [
  {
    question: "界線守門員是什麼？",
    answer: "界線守門員是面向台灣受雇勞工的工具，協助分析收到的主管訊息，提供風險提示、法規參考、回覆改進建議與後續行動方向。",
  },
  {
    question: "這是法律意見或律師代理嗎？",
    answer: "不是。界線守門員使用 AI 提供一般性勞動法資訊與溝通建議，不構成法律意見。重大決定請諮詢 1955 勞工諮詢申訴專線或專業律師。",
  },
  {
    question: "如何使用界線守門員分析主管訊息？",
    answer: "在首頁貼上主管傳來的訊息，按下「檢查這則訊息」，即可取得風險等級、可能涉及的法規、白話解釋、改進建議與你可以做的事。",
  },
  {
    question: "我的訊息會被儲存在伺服器嗎？",
    answer: "預設不會在伺服器長期儲存主管原始訊息。案件紀錄僅在使用者明確儲存時寫入瀏覽器本機，不含完整原文。",
  },
  {
    question: "界線守門員會幫我寫完整回覆嗎？",
    answer: "不會提供可直接複製貼上的完整回覆草稿，而是提供如何補充脈絡、釐清要求與調整回應方向的改進建議，由使用者自行撰寫回覆。",
  },
] as const;

export function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#app`,
        name: "界線守門員",
        alternateName: "Labor Filter",
        url: siteUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: "zh-TW",
        description:
          "台灣勞工專用的主管訊息分析工具，提供風險提示、法規參考、回覆改進建議與本機案件紀錄。",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "TWD",
        },
        audience: {
          "@type": "Audience",
          audienceType: "台灣受雇勞工",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "界線守門員",
        inLanguage: "zh-TW",
        publisher: { "@id": `${siteUrl}/#app` },
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
