import { LINE_OA_ADD_URL, LINE_OA_ID, LINE_OA_QR_SRC, PRODUCT_NAME_ZH } from "@/src/product";

export function LineOfficialAccount() {
  return (
    <aside className="line-join card" aria-labelledby="line-join-heading">
      <div className="line-join-copy">
        <p className="eyebrow">LINE 官方帳號</p>
        <h2 id="line-join-heading">用 LINE 傳送訊息</h2>
        <p>
          加入「{PRODUCT_NAME_ZH}」，把主管訊息貼到聊天室，即可取得與網站相同的分析。
        </p>
        <p className="line-join-id">帳號 ID：{LINE_OA_ID}</p>
        <a
          className="line-join-button"
          href={LINE_OA_ADD_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          加入 LINE 官方帳號
        </a>
      </div>
      <a
        className="line-join-qr"
        href={LINE_OA_ADD_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={LINE_OA_QR_SRC}
          alt={`掃描加入${PRODUCT_NAME_ZH} LINE 官方帳號`}
          width={168}
          height={168}
        />
      </a>
    </aside>
  );
}
