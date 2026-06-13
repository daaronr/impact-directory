"""
founders_pledge.py — importer for Founders Pledge public member companies.

Data source:
  https://founderspledge.com/members — server-rendered HTML.
  Only members who have opted to make their pledge public are shown (~24 as of 2026-04).
  Total membership is ~350+ but identities are private.

What we capture:
  - The companies associated with public Founders Pledge members.
  - The pledge is a personal giving commitment by the founder/executive,
    not a corporate pledge. The org entry notes this distinction.

Schema mapping:
  - org_type: "company"
  - claim_type: "founders_pledge"
  - confidence: 0.80 (personal pledge linked to company; company itself hasn't pledged)
  - risk_level: "low" (high-profile public commitment with social accountability)
"""

import re
import requests

from .base_importer import BaseImporter

SOURCE_URL = "https://founderspledge.com/members"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; ImpactDirectoryBot/1.0; "
        "+https://impact-products-directory.netlify.app)"
    )
}


def _extract_company(role: str) -> str | None:
    """Extract company name from a role description.

    Examples:
      'Co-Founder and CEO of Canva'        → 'Canva'
      'Founder, Unity Technologies'        → 'Unity Technologies'
      'Founder/CEO n8n'                    → 'n8n'
      'CEO of Monzo'                       → 'Monzo'
    """
    role = role.replace("&amp;", "&")

    # "... of COMPANY" at end of string
    m = re.search(r"\bof\s+([A-Za-z0-9][A-Za-z0-9\s&./'\-]+?)$", role)
    if m:
        return m.group(1).strip()

    # "..., COMPANY" — e.g. "Founder, Unity Technologies"
    m = re.search(r",\s+([A-Z][A-Za-z0-9\s&./'\-]+?)$", role)
    if m:
        return m.group(1).strip()

    # "ROLE COMPANY" — e.g. "Founder/CEO n8n"
    m = re.search(
        r"(?:CEO|Founder|Co-founder|CTO|COO)\s+([A-Za-z0-9][A-Za-z0-9\s&./'\-]+?)$",
        role,
        re.IGNORECASE,
    )
    if m:
        return m.group(1).strip()

    return None


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


class FoundersPledgeImporter(BaseImporter):
    SOURCE_ID = "src-founders-pledge"
    SOURCE_URL = SOURCE_URL

    def fetch_raw(self) -> list[dict]:
        """Scrape public member list from Founders Pledge website."""
        resp = requests.get(SOURCE_URL, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        html = resp.text

        # Members are rendered as: <h3>Founder Name</h3><p>Role at Company</p>
        members = re.findall(r"<h3>([^<]+)</h3>\s*<p>([^<]+)</p>", html)

        if not members:
            raise RuntimeError(
                "No member entries found on Founders Pledge members page. "
                "The page structure may have changed — check " + SOURCE_URL
            )

        print(f"  Found {len(members)} public Founders Pledge members on page")

        result = []
        for raw_name, raw_role in members:
            name = raw_name.strip()
            role = raw_role.strip().replace("&amp;", "&")
            company = _extract_company(role)
            if company:
                result.append({
                    "founder_name": name,
                    "role": role,
                    "company": company,
                })
            else:
                print(f"  Could not extract company from role: {role!r}")

        print(f"  Extracted company for {len(result)}/{len(members)} members")
        return result

    def transform(self, raw: list[dict]) -> dict:
        today = self.today
        organizations, offerings, claims = [], [], []
        seen_slugs: set[str] = set()

        for entry in raw:
            company = entry["company"]
            founder = entry["founder_name"]
            role = entry["role"]

            slug = _slug(company)
            if slug in seen_slugs:
                continue
            seen_slugs.add(slug)

            org_id = self.make_org_id(slug)
            off_id = self.make_offering_id(f"{slug}-fp")
            claim_id = self.make_claim_id(slug, "founders-pledge")

            organizations.append({
                "id": org_id,
                "slug": slug,
                "name": company,
                "description": (
                    f"{company} was founded or is led by {founder} ({role}), "
                    "who has publicly committed to give a significant portion of "
                    "lifetime wealth to highly effective charities via the Founders Pledge."
                ),
                "website": None,
                "org_type": "company",
                "country": None,
                "source_ids": [self.SOURCE_ID],
                "verified": False,
                "claimed": False,
                "tags": ["founders-pledge", "effective-giving"],
                "commitment_tier": "moderate",
                "added": today,
                "updated": today,
            })

            offerings.append({
                "id": off_id,
                "slug": f"{slug}-fp",
                "name": f"{company} — Founders Pledge",
                "org_id": org_id,
                "offering_type": "company",
                "exactness": "inferred",
                "category": "Charitable Employer",
                "description": (
                    f"Company led by a public Founders Pledge member "
                    f"({founder}: {role}). Founders Pledge members publicly commit "
                    "to give a meaningful portion of personal proceeds to the most "
                    "effective charities in the world."
                ),
                "tags": ["founders-pledge", "effective-giving"],
                "added": today,
                "updated": today,
            })

            claims.append({
                "id": claim_id,
                "offering_id": off_id,
                "org_id": org_id,
                "claim_type": "founders_pledge",
                "claim_text": (
                    "I pledge that when I exit my company or on a recurring basis, "
                    "I will give a meaningful portion of my personal proceeds to "
                    "the most effective charities in the world."
                ),
                "parsed_value": {},
                "confidence": 0.80,
                "risk_level": "low",
                "source_id": self.SOURCE_ID,
                "beneficiary": "Effective charities (Founders Pledge recommended)",
                "cause_area": "Effective Giving",
                "impact_scope": "founders-pledge",
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
