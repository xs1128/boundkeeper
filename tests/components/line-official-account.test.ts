// @vitest-environment happy-dom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LineOfficialAccount } from "../../components/LineOfficialAccount";
import { LINE_OA_ADD_URL, LINE_OA_ID, PRODUCT_NAME_ZH } from "../../src/product";

describe("LineOfficialAccount", () => {
  it("links the official account add-friend URL and QR", () => {
    const html = renderToStaticMarkup(createElement(LineOfficialAccount));
    expect(html).toContain(PRODUCT_NAME_ZH);
    expect(html).toContain(LINE_OA_ID);
    expect(html).toContain(LINE_OA_ADD_URL);
    expect(html).toContain("/line-oa-qr.jpg");
  });
});
