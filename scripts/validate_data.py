"""
validate_data.py — validates JSON structure, required fields, and cross-references.

Run:
  python scripts/validate_data.py
  python scripts/validate_data.py --strict   # exit 1 on warnings too
"""

import json
import os
import sys
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONSOLIDATED = os.path.join(ROOT, "public", "data", "all_data.json")

STRICT = "--strict" in sys.argv

errors = []
warnings = []


def err(msg):
    errors.append(msg)
    print(f"ERROR: {msg}")


def warn(msg):
    warnings.append(msg)
    print(f"WARN:  {msg}")


def check_required(obj, fields, context):
    for field in fields:
        if field not in obj or obj[field] is None:
            err(f"{context} missing required field '{field}'")


def main():
    if not os.path.exists(CONSOLIDATED):
        err(f"Consolidated file not found: {CONSOLIDATED}")
        err("Run: python scripts/consolidate.py")
        sys.exit(1)

    with open(CONSOLIDATED, "r", encoding="utf-8") as f:
        data = json.load(f)

    sources = data.get("sources", [])
    organizations = data.get("organizations", [])
    offerings = data.get("offerings", [])
    claims = data.get("claims", [])

    source_ids = {s["id"] for s in sources}
    org_ids = {o["id"] for o in organizations}
    offering_ids = {o["id"] for o in offerings}

    # Check sources
    for s in sources:
        check_required(s, ["id", "name", "source_type"], f"Source {s.get('id', '?')}")
        if "url" not in s:
            err(f"Source {s.get('id', '?')} missing required field 'url'")

    # Check organizations
    for org in organizations:
        check_required(org, ["id", "slug", "name", "description", "org_type"], f"Org {org.get('id', '?')}")
        if org.get("org_type") not in ("company", "nonprofit", "cooperative", "foundation", "other"):
            warn(f"Org {org['id']}: unexpected org_type '{org.get('org_type')}'")
        for sid in (org.get("source_ids") or []):
            if sid not in source_ids:
                err(f"Org {org['id']}: unknown source_id '{sid}'")

    # Check offerings
    for off in offerings:
        check_required(off, ["id", "slug", "name", "org_id", "offering_type", "exactness", "category"], f"Offering {off.get('id', '?')}")
        if off.get("org_id") not in org_ids:
            err(f"Offering {off['id']}: unknown org_id '{off.get('org_id')}'")
        if off.get("exactness") not in ("exact", "collection", "inferred"):
            warn(f"Offering {off['id']}: unexpected exactness '{off.get('exactness')}'")

    # Check claims
    for claim in claims:
        check_required(claim, ["id", "org_id", "claim_type", "claim_text", "confidence", "risk_level", "source_id", "cause_area"], f"Claim {claim.get('id', '?')}")
        if claim.get("org_id") and claim["org_id"] not in org_ids:
            err(f"Claim {claim['id']}: unknown org_id '{claim['org_id']}'")
        if claim.get("offering_id") and claim["offering_id"] not in offering_ids:
            err(f"Claim {claim['id']}: unknown offering_id '{claim['offering_id']}'")
        if claim.get("source_id") and claim["source_id"] not in source_ids:
            err(f"Claim {claim['id']}: unknown source_id '{claim['source_id']}'")
        conf = claim.get("confidence")
        if conf is not None and not (0.0 <= conf <= 1.0):
            err(f"Claim {claim['id']}: confidence {conf} out of range [0, 1]")
        if claim.get("risk_level") not in ("low", "medium", "high"):
            warn(f"Claim {claim['id']}: unexpected risk_level '{claim.get('risk_level')}'")

    print(f"\nValidated {len(organizations)} orgs, {len(offerings)} offerings, {len(claims)} claims")
    print(f"Errors: {len(errors)}  Warnings: {len(warnings)}")

    if errors:
        sys.exit(1)
    if STRICT and warnings:
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
