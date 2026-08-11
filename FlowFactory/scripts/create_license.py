#!/usr/bin/env python3
"""Create a monthly or lifetime license through the private admin API."""

import argparse
import json
import os
import urllib.request


parser = argparse.ArgumentParser()
parser.add_argument("plan", choices=["monthly", "lifetime"])
parser.add_argument("--months", type=int, default=1)
parser.add_argument("--max-devices", type=int, default=3)
parser.add_argument("--count", type=int, default=1, help="一次建立的授權碼數量（1–100）")
args = parser.parse_args()
if not 1 <= args.count <= 100:
    raise SystemExit("--count 必須介於 1 到 100")
endpoint = os.environ.get("FLOWFACTORY_LICENSE_ADMIN_URL", "https://flowfactory-license.gavinlo3692.workers.dev").rstrip("/")
token = os.environ.get("FLOWFACTORY_LICENSE_ADMIN_TOKEN", "")
if not token:
    raise SystemExit("請先設定 FLOWFACTORY_LICENSE_ADMIN_TOKEN")
payload = {"plan": args.plan, "max_devices": args.max_devices}
if args.plan == "monthly":
    payload["duration_months"] = max(1, args.months)
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
licenses = []
for _ in range(args.count):
    request = urllib.request.Request(endpoint + "/v1/admin/licenses", data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", "Authorization": "Bearer " + token, "User-Agent": "FlowFactory-License-Admin/1.0"}, method="POST")
    with opener.open(request, timeout=20) as response:
        licenses.append(json.load(response))
result = licenses[0] if args.count == 1 else {"count": len(licenses), "licenses": licenses}
print(json.dumps(result, ensure_ascii=False, indent=2))
