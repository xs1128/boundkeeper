"""Extract selected official articles from a locally downloaded MOJ ZIP.

Usage: python3 extract-law-snapshot.py archive.zip output.json
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


def extract(archive_path: Path) -> dict:
    archive_bytes = archive_path.read_bytes()
    with zipfile.ZipFile(archive_path) as archive:
        xml_bytes = archive.read("FalV.xml")
    root = ET.fromstring(xml_bytes)
    result = {
        "datasetUrl": "https://data.gov.tw/dataset/18289",
        "downloadUrl": "https://sendlaw.moj.gov.tw/PublicData/GetFile.ashx?DType=XML&AuData=CF",
        "archiveSha256": hashlib.sha256(archive_bytes).hexdigest(),
        "xmlSha256": hashlib.sha256(xml_bytes).hexdigest(),
        "upstreamUpdateDate": root.attrib["UpdateDate"],
        "extractionNote": "Selected articles only; original article text and history retained. Not the complete law database.",
        "laws": [],
    }
    for name, numbers in SELECTED.items():
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
    if len(sys.argv) != 3:
        raise SystemExit("Usage: extract-law-snapshot.py archive.zip output.json")
    data = extract(Path(sys.argv[1]))
    # Refuse accidental overwrite of a reviewed snapshot.
    with Path(sys.argv[2]).open("x", encoding="utf-8") as output:
        output.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
