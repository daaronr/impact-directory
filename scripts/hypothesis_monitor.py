#!/usr/bin/env python3
"""
Monitor Hypothes.is annotations on impact-products-directory.netlify.app.

Fetches all public annotations on the site, identifies ones tagged #implement,
and logs them for human review. Never auto-applies anything — all changes
require explicit approval in a Claude Code session.

Usage:
    python3 scripts/hypothesis_monitor.py            # check for new annotations
    python3 scripts/hypothesis_monitor.py --all      # show all annotations (not just new)

Cron (daily at 9am):
    0 9 * * * cd /path/to/impact-directory && python3 scripts/hypothesis_monitor.py >> /tmp/hypothesis_impact.log 2>&1
"""

import json
import os
import sys
import requests
from datetime import datetime
from pathlib import Path

SITE_URL = "https://impact-products-directory.netlify.app"
HYPOTHESIS_API = "https://api.hypothes.is/api/search"
STATE_FILE = Path(__file__).parent.parent / ".private" / "hypothesis_seen.json"
LOG_FILE = Path("/tmp/hypothesis_impact.log")

# URL patterns to monitor
MONITORED_URLS = [
    f"{SITE_URL}/",
    f"{SITE_URL}/search",
    f"{SITE_URL}/about",
    f"{SITE_URL}/feedback",
]


def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)


def fetch_annotations(url_pattern):
    """Fetch all public annotations for a URL pattern."""
    try:
        resp = requests.get(HYPOTHESIS_API, params={
            "wildcard_uri": url_pattern,
            "limit": 200,
            "order": "desc",
        }, timeout=30)
        resp.raise_for_status()
        return resp.json().get("rows", [])
    except Exception as e:
        log(f"ERROR fetching {url_pattern}: {e}")
        return []


def load_state():
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"seen_ids": [], "last_check": None}


def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))


def format_annotation(ann):
    user = ann.get("user", "").split(":")[-1].split("@")[0]
    text = ann.get("text", "").strip()
    uri = ann.get("uri", "")
    ann_id = ann["id"]

    # Get quoted text
    quoted = None
    for sel in ann.get("target", [{}])[0].get("selector", []):
        if sel.get("type") == "TextQuoteSelector":
            quoted = sel.get("exact", "")[:120]
            break

    lines = [
        f"  ID:      {ann_id}",
        f"  User:    @{user}",
        f"  Page:    {uri}",
        f"  Link:    https://hypothes.is/a/{ann_id}",
    ]
    if quoted:
        lines.append(f"  Quoted:  \"{quoted}\"")
    if text:
        lines.append(f"  Comment: {text[:300]}")
    return "\n".join(lines)


def main():
    show_all = "--all" in sys.argv

    log(f"Checking Hypothes.is for {SITE_URL}")
    log(f"Monitoring {len(MONITORED_URLS)} URL patterns")

    all_annotations = []
    for url in MONITORED_URLS:
        anns = fetch_annotations(url + "*")
        all_annotations.extend(anns)

    # Also check the root wildcard
    all_annotations.extend(fetch_annotations(SITE_URL + "/*"))

    # Deduplicate
    seen_in_fetch = set()
    unique = []
    for ann in all_annotations:
        if ann["id"] not in seen_in_fetch:
            seen_in_fetch.add(ann["id"])
            unique.append(ann)
    all_annotations = unique

    log(f"Total annotations found: {len(all_annotations)}")

    state = load_state()
    seen_ids = set(state.get("seen_ids", []))

    new_annotations = [a for a in all_annotations if a["id"] not in seen_ids]
    implement_annotations = [
        a for a in all_annotations
        if "#implement" in a.get("text", "").lower()
        or any("#implement" in t.lower() for t in a.get("tags", []))
    ]

    log(f"New annotations:       {len(new_annotations)}")
    log(f"#implement requests:   {len(implement_annotations)}")

    if implement_annotations:
        log("\n=== ANNOTATIONS REQUESTING CHANGES (#implement) ===")
        for ann in implement_annotations:
            log(f"\n{'NEW ' if ann['id'] not in seen_ids else '    '}{format_annotation(ann)}")

    if new_annotations:
        log("\n=== ALL NEW ANNOTATIONS ===")
        for ann in new_annotations:
            log(f"\n{format_annotation(ann)}")
    elif show_all and all_annotations:
        log("\n=== ALL ANNOTATIONS ===")
        for ann in all_annotations:
            log(f"\n{format_annotation(ann)}")

    # Update state
    state["seen_ids"] = list(seen_ids | {a["id"] for a in all_annotations})
    state["last_check"] = datetime.now().isoformat()
    save_state(state)

    log("\nDone. To review and implement changes, run a Claude Code session and say:")
    log("  'Check hypothesis annotations on the impact directory and suggest implementations'")


if __name__ == "__main__":
    main()
