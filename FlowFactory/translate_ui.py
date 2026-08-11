#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""translate_ui.py — Dịch toàn bộ chuỗi tiếng Trung trong index.html (FlowFactory MASTER) sang tiếng Việt.
Bảng ánh xạ nằm trong thư mục translate_parts/*.json (dict chuoi_zh -> chuoi_vi).
Cơ chế: thay thế chuỗi dài trước, ngắn sau (tránh thay lồng nhau), giữ nguyên cấu trúc HTML/JS.
"""
import glob
import io
import json
import os
import sys
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = r"D:\Project\LV\MASTER\FlowFactory"
TARGET = os.path.join(BASE, "index.html")
PARTS_DIR = os.path.join(BASE, "translate_parts")


def load_map():
    merged = {}
    for path in sorted(glob.glob(os.path.join(PARTS_DIR, "*.json"))):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        merged.update(data)
    return merged


def has_cjk(text):
    return bool(re.search(r'[\u3000-\u9fff]', text))


def main():
    if not os.path.isdir(PARTS_DIR):
        print("Thieu thu muc translate_parts")
        return 1
    mapping = load_map()
    if not mapping:
        print("Mapping rong")
        return 1

    with open(TARGET, encoding="utf-8") as f:
        html = f.read()

    # thay chuoi dai -> ngan
    for key in sorted(mapping, key=len, reverse=True):
        value = mapping[key]
        if key == value:
            continue
        count = html.count(key)
        if count:
            html = html.replace(key, value)
            print(f"  [{count}x] {key[:40]}... -> {value[:40]}...")

    # kiem tra con CJK
    remaining = re.findall(r'[\u3000-\u9fff][\u3000-\u9fffA-Za-z0-9 _\-\.\/\,\(\):：、，。！？\+\#\*%\&=<>]*[\u3000-\u9fff]', html)
    uniq = sorted(set(c.strip() for c in remaining if c.strip()), key=len)
    print(f"\nCon lai {len(uniq)} chuoi CJK (dai->ngan):")
    for c in uniq[:40]:
        print("   ", repr(c))

    with open(TARGET, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    print(f"\nDa ghi {TARGET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
