"""Extract selected official articles from a locally downloaded MOJ ZIP.

Usage: python3 extract-law-snapshot.py archive.zip output.json [original|expansion|regulations]
No network access. This creates evidence, never updates curated summaries.
"""

import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
import zipfile


SELECTED = {
    "勞動基準法": ["10-1", "11", "12", "14", "16", "17", "24", "30", "32", "32-1", "42", "84-1"],
    "職業安全衛生法": ["22-1", "22-2", "22-3"],
    "勞工退休金條例": ["12"],
}

EXPANSION = {
    "勞動基準法": ["22", "23", "26", "35", "36", "37", "38", "39", "43", "74"],
    "性別平等工作法": ["1", "2", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "32-1", "36"],
    "就業服務法": ["5"],
    "最低工資法（112.12.27制定）": ["5"],
    "職業安全衛生法": ["18"],
}
REGULATIONS = {"勞工請假規則": ["4", "7", "9", "9-1", "10"]}


def extract(archive_path: Path, profile: str = "original") -> dict:
    selected = {"original": SELECTED, "expansion": EXPANSION, "regulations": REGULATIONS}[profile]
    is_regulation = profile == "regulations"
    xml_name = "MingLing.xml" if is_regulation else "FalV.xml"
    dataset_id = "18290" if is_regulation else "18289"
    archive_kind = "CM" if is_regulation else "CF"
    archive_bytes = archive_path.read_bytes()
    with zipfile.ZipFile(archive_path) as archive:
        xml_bytes = archive.read(xml_name)
    root = ET.fromstring(xml_bytes)
    result = {
        "datasetUrl": f"https://data.gov.tw/dataset/{dataset_id}",
        "downloadUrl": f"https://sendlaw.moj.gov.tw/PublicData/GetFile.ashx?DType=XML&AuData={archive_kind}",
        "archiveSha256": hashlib.sha256(archive_bytes).hexdigest(),
        "xmlSha256": hashlib.sha256(xml_bytes).hexdigest(),
        "upstreamUpdateDate": root.attrib["UpdateDate"],
        "extractionNote": "Selected articles only; original article text and history retained. Not the complete law database.",
        "laws": [],
    }
    for name, numbers in selected.items():
        matches = [law for law in root if law.findtext("法規名稱") == name]
        if len(matches) != 1:
            raise ValueError(f"Expected exactly one law: {name}")
        law = matches[0]
        articles = []
        for number in numbers:
            matching = [a for a in law.findall(".//條文") if a.findtext("條號") == f"第 {number} 條"]
            if len(matching) != 1:
                raise ValueError(f"Expected exactly one article: {name} {number}")
            text = matching[0].findtext("條文內容")
            if not text or not text.strip():
                raise ValueError(f"Empty article: {name} {number}")
            articles.append({"articleNumber": number, "textZh": text})
        result["laws"].append({
            "nameZh": name,
            "canonicalUrl": law.findtext("法規網址"),
            "amendedDateRaw": law.findtext("最新異動日期"),
            "effectiveDateRaw": (law.findtext("生效日期") or "").strip() or None,
            "effectiveContentZh": (law.findtext("生效內容") or "").strip() or None,
            "historyZh": law.findtext("沿革內容"),
            "articles": articles,
        })
    return result


if __name__ == "__main__":
    if len(sys.argv) not in (3, 4) or (len(sys.argv) == 4 and sys.argv[3] not in ("original", "expansion", "regulations")):
        raise SystemExit("Usage: extract-law-snapshot.py archive.zip output.json [original|expansion|regulations]")
    data = extract(Path(sys.argv[1]), sys.argv[3] if len(sys.argv) == 4 else "original")
    # Refuse accidental overwrite of a reviewed snapshot.
    with Path(sys.argv[2]).open("x", encoding="utf-8") as output:
        output.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
