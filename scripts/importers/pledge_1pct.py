"""
pledge_1pct.py — importer for Pledge 1% member showcase.

Data source:
  https://www.pledge1percent.org/pledge-1-members/
  API: https://www.pledge1percent.org/wp-json/pledge-one/v1/logos-search
       No pagination params needed — returns all ~1,841 showcase members at once.

  Fields per record: id, title (company name), image.src, url (website)

About Pledge 1%:
  Founded by Salesforce. Members commit to set aside 1% of equity, product,
  profit, and/or employee time for social impact (the "1/1/1 model").
  Over 19,000 companies have signed the pledge. This showcase includes ~1,841
  featured companies that have submitted logos to the directory.

  Commitment tier: "moderate" — the 1% equity pledge (especially from startups)
  can be quite substantial. Broader and often more meaningful than 1% of revenue.

Schema mapping:
  - org_type: "company"
  - commitment_tier: "moderate"
  - claim_type: "pledge"
  - confidence: 0.80 (self-reported showcase; no annual certification requirement)
  - risk_level: "medium"
  - source_id: "src-pledge-1pct"

UI note:
  Shown by default at "Moderate or better" filter level.
"""

import re
import requests

from .base_importer import BaseImporter

API_URL = "https://www.pledge1percent.org/wp-json/pledge-one/v1/logos-search"
SOURCE_ID = "src-pledge-1pct"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; ImpactDirectoryBot/1.0; "
        "+https://impact-products-directory.netlify.app)"
    )
}

CLAIM_TEXT = (
    "We pledge 1% of equity, product, and employee time for social impact."
)


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _name_from_image(src: str) -> str:
    """Fallback: extract company name from image filename."""
    fname = src.split("/")[-1]
    fname = re.sub(r"-\d+x\d+", "", fname)   # strip dimension suffix
    fname = fname.rsplit(".", 1)[0]           # remove extension
    fname = re.sub(r"[-_]+", " ", fname).strip()
    return fname


class Pledge1PctImporter(BaseImporter):
    SOURCE_ID = SOURCE_ID
    SOURCE_URL = "https://www.pledge1percent.org/pledge-1-members/"

    def fetch_raw(self) -> list[dict]:
        resp = requests.get(API_URL, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, list):
            raise RuntimeError(f"Unexpected response from logos-search: {type(data)}")
        print(f"  Pledge 1% logos-search: {len(data)} entries")
        return data

    def transform(self, raw: list[dict]) -> dict:
        today = self.today
        organizations, offerings, claims = [], [], []
        seen_slugs: set[str] = set()

        for entry in raw:
            name = (entry.get("title") or "").strip()
            if not name:
                # Fall back to image filename
                img_src = (entry.get("image") or {}).get("src", "")
                name = _name_from_image(img_src) if img_src else ""
            if not name:
                continue

            website = (entry.get("url") or "").strip() or None

            slug = _slug(name)
            base_slug = slug
            counter = 2
            while slug in seen_slugs:
                slug = f"{base_slug}-{counter}"
                counter += 1
            seen_slugs.add(slug)

            org_id = self.make_org_id(slug)
            off_id = self.make_offering_id(f"{slug}-pledge1pct")
            claim_id = self.make_claim_id(slug, "pledge-1pct")

            organizations.append({
                "id": org_id,
                "slug": slug,
                "name": name,
                "description": (
                    f"{name} has signed the Pledge 1% commitment, setting aside "
                    "1% of equity, product, and/or employee time for social impact."
                ),
                "website": website,
                "org_type": "company",
                "country": None,
                "source_ids": [SOURCE_ID],
                "verified": False,
                "claimed": False,
                "tags": ["pledge-1pct", "1pct-model"],
                "commitment_tier": "moderate",
                "added": today,
                "updated": today,
            })

            offerings.append({
                "id": off_id,
                "slug": f"{slug}-pledge1pct",
                "name": f"{name} — Pledge 1%",
                "org_id": org_id,
                "offering_type": "company",
                "exactness": "inferred",
                "category": "Pledge 1% member",
                "description": (
                    f"{name} is a Pledge 1% member. The company commits to give "
                    "1% of equity, product, and/or employee volunteer time for "
                    "social impact."
                ),
                "tags": ["pledge-1pct"],
                "added": today,
                "updated": today,
            })

            claims.append({
                "id": claim_id,
                "offering_id": off_id,
                "org_id": org_id,
                "claim_type": "pledge",
                "claim_text": CLAIM_TEXT,
                "parsed_value": {"model": "1/1/1", "basis": "equity_product_time"},
                "confidence": 0.80,
                "risk_level": "medium",
                "source_id": SOURCE_ID,
                "beneficiary": "Social impact causes (self-directed)",
                "cause_area": "Social Impact",
                "impact_scope": "general",
                "status": "active",
                "valid_from": None,
                "valid_until": None,
                "added": today,
                "updated": today,
            })

        print(
            f"  Mapped {len(organizations)} orgs / {len(offerings)} offerings "
            f"/ {len(claims)} claims."
        )
        return {
            "organizations": organizations,
            "offerings": offerings,
            "claims": claims,
        }
