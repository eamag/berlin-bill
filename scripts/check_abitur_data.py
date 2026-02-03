#!/usr/bin/env python3
# python3 scripts/check_abitur_data.py
# Check that the abitur-2025.xlsx file matches the static/abitur-2025.json file.
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
XLSX_PATH = ROOT / "abitur-2025.xlsx"
JSON_PATH = ROOT / "static" / "abitur-2025.json"

NS = {"d": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"d": "http://schemas.openxmlformats.org/package/2006/relationships"}


def colrow(cell_ref: str):
    col = "".join([c for c in cell_ref if c.isalpha()])
    row = int("".join([c for c in cell_ref if c.isdigit()]))
    return col, row


def maybe_number(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return value
    s = str(value).strip()
    if s == "" or s == "-":
        return None if s == "-" else ""
    if re.fullmatch(r"-?\d+(\.\d+)?", s):
        try:
            return float(s) if "." in s else int(s)
        except Exception:
            return s
    return s


def parse_xlsx_to_json(xlsx_path: Path):
    with zipfile.ZipFile(xlsx_path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            ss = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in ss.findall("d:si", NS):
                texts = [t.text or "" for t in si.findall(".//d:t", NS)]
                shared.append("".join(texts))

        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        relmap = {
            r.attrib["Id"]: r.attrib["Target"]
            for r in rels.findall("d:Relationship", REL_NS)
        }

        wb = ET.fromstring(z.read("xl/workbook.xml"))
        sheets = []
        for s in wb.findall("d:sheets/d:sheet", NS):
            sheets.append(
                {
                    "name": s.attrib["name"],
                    "rid": s.attrib[
                        "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
                    ],
                }
            )

        def parse_cell(c):
            t = c.attrib.get("t")
            v_node = c.find("d:v", NS)
            if t == "s":
                return shared[int(v_node.text)] if v_node is not None else None
            if t == "b":
                return (v_node.text == "1") if v_node is not None else False
            if t == "inlineStr":
                is_node = c.find("d:is/d:t", NS)
                return is_node.text if is_node is not None else ""
            return v_node.text if v_node is not None else None

        out = {"source": "abitur-2025.xlsx", "sheets": {}}

        for s in sheets:
            target = relmap[s["rid"]]
            sh = ET.fromstring(z.read("xl/" + target))
            rows = []
            for row in sh.findall("d:sheetData/d:row", NS):
                row_idx = int(row.attrib.get("r", len(rows) + 1))
                row_vals = {}
                for c in row.findall("d:c", NS):
                    r = c.attrib.get("r")
                    if not r:
                        continue
                    col, _ = colrow(r)
                    row_vals[col] = parse_cell(c)
                rows.append((row_idx, row_vals))

            if not rows:
                out["sheets"][s["name"]] = {"headers": [], "rows": []}
                continue

            rows_sorted = sorted(rows, key=lambda x: x[0])
            header_row = None
            for _, vals in rows_sorted:
                if any(v is not None for v in vals.values()):
                    header_row = vals
                    break

            if header_row is None:
                out["sheets"][s["name"]] = {"headers": [], "rows": []}
                continue

            def col_key(c):
                n = 0
                for ch in c:
                    n = n * 26 + (ord(ch.upper()) - 64)
                return n

            header_cols = sorted(header_row.keys(), key=col_key)
            headers = [header_row.get(c) or f"col_{c}" for c in header_cols]

            data_rows = []
            header_started = False
            for _, vals in rows_sorted:
                if not header_started:
                    if vals == header_row:
                        header_started = True
                    continue

                row_obj = {}
                empty = True
                for c, h in zip(header_cols, headers):
                    v = maybe_number(vals.get(c))
                    if v is not None and v != "":
                        empty = False
                    row_obj[h] = v
                if not empty:
                    data_rows.append(row_obj)

            out["sheets"][s["name"]] = {"headers": headers, "rows": data_rows}

        return out


def compare(a, b, path=""):
    diffs = []

    if isinstance(a, dict) and isinstance(b, dict):
        a_keys = set(a.keys())
        b_keys = set(b.keys())
        for k in sorted(a_keys - b_keys):
            diffs.append(f"Missing in JSON: {path}/{k}")
        for k in sorted(b_keys - a_keys):
            diffs.append(f"Extra in JSON: {path}/{k}")
        for k in sorted(a_keys & b_keys):
            diffs.extend(compare(a[k], b[k], f"{path}/{k}"))
        return diffs

    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            diffs.append(f"Length mismatch at {path}: {len(a)} vs {len(b)}")
        for i, (ai, bi) in enumerate(zip(a, b)):
            diffs.extend(compare(ai, bi, f"{path}[{i}]"))
        return diffs

    # numeric tolerance
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if abs(a - b) > 1e-9:
            diffs.append(f"Value mismatch at {path}: {a} vs {b}")
        return diffs

    if a != b:
        diffs.append(f"Value mismatch at {path}: {a} vs {b}")
    return diffs


def main():
    if not XLSX_PATH.exists():
        print(f"Missing {XLSX_PATH}")
        return 2
    if not JSON_PATH.exists():
        print(f"Missing {JSON_PATH}")
        return 2

    parsed = parse_xlsx_to_json(XLSX_PATH)
    existing = json.loads(JSON_PATH.read_text())

    diffs = compare(parsed, existing, path="")
    if diffs:
        print("Mismatch between XLSX and JSON:")
        for diff in diffs[:50]:
            print("-", diff)
        if len(diffs) > 50:
            print(f"... {len(diffs) - 50} more")
        return 1

    print("OK: abitur-2025.xlsx matches static/abitur-2025.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
