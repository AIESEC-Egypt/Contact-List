#!/usr/bin/env python3
"""Pull AIESEC in Egypt contact-list tabs from Google Sheets into /data/*.json."""
from __future__ import print_function

import json
import os
import sys

try:
    from urllib.request import Request, urlopen
except ImportError:
    from urllib2 import Request, urlopen

SHEET_ID = "1ngFj_4NdfiIEkBZeJK90sVQEFIiTdSS7Y0A_0DZwZl4"
GIDS = [
    "1547061093",
    "817509336",
    "817120236",
    "1737203365",
    "2077362824",
    "1141905406",
    "415272296",
    "216502838",
    "2099907944",
    "2025687208",
    "1113947137",
    "1937455596",
    "1885546657",
]


def fetch_gviz(gid):
    url = (
        "https://docs.google.com/spreadsheets/d/%s/gviz/tq?tqx=out:json&gid=%s"
        % (SHEET_ID, gid)
    )
    req = Request(url, headers={"User-Agent": "AIESEC-Egypt-contact-list/1.0"})
    raw = urlopen(req, timeout=45).read().decode("utf-8", "replace")
    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end < start:
        raise ValueError("Could not parse gviz for gid %s" % gid)
    return json.loads(raw[start : end + 1])


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, "data")
    os.makedirs(out_dir, exist_ok=True)
    ok = 0
    for gid in GIDS:
        path = os.path.join(out_dir, gid + ".json")
        try:
            payload = fetch_gviz(gid)
            with open(path, "w") as fh:
                json.dump(payload, fh)
            ok += 1
            print("ok", gid)
        except Exception as exc:
            print("fail", gid, exc)
    if ok == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
