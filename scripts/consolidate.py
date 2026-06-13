"""
consolidate.py — merges individual JSON data files into public/data/all_data.json.

Similar pattern to Library of Things consolidate.py.

Data directory layout:
  data/sources/sources.json
  data/organizations/organizations.json    (or *.json files, one per org)
  data/offerings/offerings.json            (or *.json files, one per offering)
  data/claims/claims.json                  (or *.json files, one per claim)

Run:
  python scripts/consolidate.py
"""

import json
import glob
import os
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
OUTPUT_FILE = os.path.join(ROOT, "public", "data", "all_data.json")


def load_collection(subdir):
    """Load all JSON files from a data subdirectory into a flat list."""
    items = []
    pattern = os.path.join(DATA_DIR, subdir, "*.json")
    for path in sorted(glob.glob(pattern)):
        with open(path, "r", encoding="utf-8") as f:
            content = json.load(f)
        if isinstance(content, list):
            items.extend(content)
        elif isinstance(content, dict):
            items.append(content)
    return items


def main():
    sources = load_collection("sources")
    organizations = load_collection("organizations")
    offerings = load_collection("offerings")
    claims = load_collection("claims")

    # Infer commitment_tier for orgs that don't have one set explicitly,
    # based on the strongest claim they have.
    # Tiers: "substantial" > "moderate" > "minimal" > None
    # substantial: structural/ownership model, 10%+ profits pledge, 100% profits donation
    # moderate:    personal pledge (Founders Pledge), EA-affiliation
    # minimal:     token commitment (1% of sales) — hidden by default in UI
    def _infer_tier(org, org_claims_map):
        if org.get("commitment_tier"):
            return org["commitment_tier"]
        tier = None
        for c in org_claims_map.get(org["id"], []):
            ct = c.get("claim_type", "")
            scope = c.get("impact_scope", "")
            pct = (c.get("parsed_value") or {}).get("percentage")
            if ct == "ownership":
                return "substantial"
            if ct == "donation_percentage" and isinstance(pct, (int, float)) and pct >= 50:
                return "substantial"
            if ct == "pledge" and scope == "gwwc":
                return "substantial"
            if ct == "founders_pledge" and tier != "substantial":
                tier = "moderate"
            if ct in ("pledge", "ea_affiliation") and tier != "substantial":
                tier = "moderate"
            if ct == "donation_percentage" and isinstance(pct, (int, float)) and pct >= 1:
                if tier is None:
                    tier = "minimal"
        return tier

    # Deduplicate by id field
    def dedup(lst):
        seen = set()
        result = []
        for item in lst:
            key = item.get("id")
            if key and key not in seen:
                seen.add(key)
                result.append(item)
        return result

    sources = dedup(sources)
    organizations = dedup(organizations)
    offerings = dedup(offerings)
    claims = dedup(claims)

    # Build per-org claims map for tier inference
    org_claims_map = {}
    for c in claims:
        oid = c.get("org_id")
        if oid:
            org_claims_map.setdefault(oid, []).append(c)

    # Fill in commitment_tier for any org that doesn't have it
    for org in organizations:
        org["commitment_tier"] = _infer_tier(org, org_claims_map)

    # Validate cross-references
    org_ids = {o["id"] for o in organizations}
    offering_ids = {o["id"] for o in offerings}
    source_ids = {s["id"] for s in sources}

    errors = []
    for off in offerings:
        if off.get("org_id") and off["org_id"] not in org_ids:
            errors.append(f"Offering {off['id']} references unknown org_id {off['org_id']}")

    for claim in claims:
        if claim.get("org_id") and claim["org_id"] not in org_ids:
            errors.append(f"Claim {claim['id']} references unknown org_id {claim['org_id']}")
        if claim.get("offering_id") and claim["offering_id"] not in offering_ids:
            errors.append(f"Claim {claim['id']} references unknown offering_id {claim['offering_id']}")
        if claim.get("source_id") and claim["source_id"] not in source_ids:
            errors.append(f"Claim {claim['id']} references unknown source_id {claim['source_id']}")

    if errors:
        print("VALIDATION ERRORS:")
        for e in errors:
            print(f"  {e}")
        raise SystemExit(1)

    output = {
        "meta": {
            "generated_at": date.today().isoformat(),
            "total_organizations": len(organizations),
            "total_offerings": len(offerings),
            "total_claims": len(claims),
            "version": "0.1.0",
        },
        "sources": sources,
        "organizations": organizations,
        "offerings": offerings,
        "claims": claims,
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Consolidated {len(organizations)} orgs, {len(offerings)} offerings, {len(claims)} claims")
    print(f"Written to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
