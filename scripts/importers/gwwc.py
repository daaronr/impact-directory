"""
gwwc.py — importer for Giving What We Can company pledgers.

Data source:
  GWWC's Sanity CMS public API (no auth required for public content):
  https://4rsg7ofo.api.sanity.io/v2021-10-21/data/query/production
  GROQ: *[_type == "companyPledge" && active == true]

  Returns all 59 active company pledge members with: name, website,
  commencementDate, pledgeRank, logo.

  The standard GWWC Company Pledge commitment is: at least 10% of net profits
  to highly effective charities (no per-company percentage stored in Sanity).

Schema mapping:
  - org_type: "company"
  - claim_type: "pledge"
  - confidence: 0.90 (well-maintained official directory)
  - risk_level: "low" (publicly committed, reputational cost to break)
  - source_id: "src-gwwc-company-pledge"
"""

import re
import requests

from .base_importer import BaseImporter

SANITY_URL = "https://4rsg7ofo.api.sanity.io/v2021-10-21/data/query/production"
GROQ_QUERY = '*[_type == "companyPledge" && active == true]'

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; ImpactDirectoryBot/1.0; "
        "+https://impact-products-directory.netlify.app)"
    )
}

# Corporate suffixes to strip when generating a clean slug
_CORP_SUFFIXES = re.compile(
    r",?\s+(llc|ltd\.?|limited|inc\.?|incorporated|corp\.?|corporation|"
    r"pty\.?\s*ltd\.?|gmbh|b\.?v\.?|s\.?a\.?r\.?l\.?|pty|co\.|plc|as|e\.u\.|"
    r"ab|oy|s\.l\.)$",
    re.IGNORECASE,
)


def _slug(name: str) -> str:
    s = _CORP_SUFFIXES.sub("", name).strip(" ,.")
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


class GWWCImporter(BaseImporter):
    SOURCE_ID = "src-gwwc-company-pledge"
    SOURCE_URL = "https://www.givingwhatwecan.org/get-involved/company-pledge"

    def fetch_raw(self) -> list[dict]:
        """Query Sanity CMS for all active GWWC company pledge members."""
        resp = requests.get(
            SANITY_URL,
            params={"query": GROQ_QUERY},
            headers=HEADERS,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        result = data.get("result", [])
        if not result:
            raise RuntimeError(
                "Sanity CMS returned zero companyPledge documents. "
                "The API endpoint or query may have changed."
            )
        print(f"  Fetched {len(result)} active company pledge members from Sanity.")
        return result

    def transform(self, raw: list[dict]) -> dict:
        today = self.today
        organizations, offerings, claims = [], [], []

        for entry in raw:
            name = (entry.get("name") or "").strip()
            if not name:
                continue

            website = (entry.get("website") or "").strip() or None
            # Fix the one entry that accidentally has the GWWC website as its own
            if website and "givingwhatwecan.org" in website:
                website = None

            commence = entry.get("commencementDate")  # ISO date string

            slug = _slug(name)
            org_id = self.make_org_id(slug)
            off_id = self.make_offering_id(f"{slug}-gwwc-pledge")
            claim_id = self.make_claim_id(slug, "gwwc-pledge")

            organizations.append({
                "id": org_id,
                "slug": slug,
                "name": name,
                "description": (
                    f"{name} is a company member of the Giving What We Can Company Pledge, "
                    "committing to donate at least 10% of net profits to highly effective charities."
                ),
                "website": website,
                "org_type": "company",
                "country": None,
                "source_ids": [self.SOURCE_ID],
                "verified": False,
                "claimed": False,
                "tags": ["gwwc-pledge", "effective-giving"],
                "commitment_tier": "substantial",
                "added": today,
                "updated": today,
            })

            offerings.append({
                "id": off_id,
                "slug": f"{slug}-gwwc-pledge",
                "name": f"{name} — GWWC Company Pledge",
                "org_id": org_id,
                "offering_type": "company",
                "exactness": "exact",
                "category": "Charitable Employer",
                "description": (
                    "Company committed to donating at least 10% of net profits "
                    "to high-impact charities via the GWWC Company Pledge."
                ),
                "tags": ["gwwc-pledge", "10pct-profits", "effective-giving"],
                "added": today,
                "updated": today,
            })

            claims.append({
                "id": claim_id,
                "offering_id": off_id,
                "org_id": org_id,
                "claim_type": "pledge",
                "claim_text": (
                    "We commit to donate at least 10% of our net profit "
                    "to high-impact charities."
                ),
                "parsed_value": {
                    "percentage": 10,
                    "basis": "profits",
                    "minimum": True,
                },
                "confidence": 0.90,
                "risk_level": "low",
                "source_id": self.SOURCE_ID,
                "beneficiary": "Effective charities (GWWC-recommended)",
                "cause_area": "Effective Giving",
                "impact_scope": "gwwc",
                "status": "active",
                "valid_from": commence,
                "valid_until": None,
                "added": today,
                "updated": today,
            })

        print(f"  Mapped {len(organizations)} orgs / {len(offerings)} offerings / {len(claims)} claims.")
        return {
            "organizations": organizations,
            "offerings": offerings,
            "claims": claims,
        }
