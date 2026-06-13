"""
one_pct_planet.py — importer for 1% for the Planet certified businesses.

Data source:
  https://directories.onepercentfortheplanet.org/ — Angular SPA business directory
  API: https://e1k3unhdf2.execute-api.us-east-1.amazonaws.com/search
       params: accountType=business, offset=N, limit=20 (max 20 per page)

  Returns up to 1000 certified member businesses with:
    id, uri, name, type, industry, address, snippet, logoUrl, location

  Note: the same API endpoint with accountType=nonprofit (or type=nonprofit) returns
  the environmental nonprofit recipients, NOT the donating businesses. The correct
  param is accountType=business.

Commitment model:
  1% for the Planet members commit to donate at least 1% of annual gross sales
  (or equivalent value in product, service, or volunteer time) to approved
  environmental nonprofits. This is a "minimal" tier commitment — meaningful
  as a certified signal but small relative to profit-sharing models.

Schema mapping:
  - org_type: "company"
  - commitment_tier: "minimal"
  - claim_type: "donation_percentage" (1% of sales)
  - confidence: 0.85 (certified directory, requires annual reporting)
  - risk_level: "low" (annual certification process maintained)
  - source_id: "src-1pct-planet"

UI note:
  Entries from this source are hidden by default in the search UI (commitment
  filter defaults to "Moderate or better"). Users can reveal them by setting
  Commitment level to "All levels".
"""

import re
import time
import requests

from .base_importer import BaseImporter

API_URL = "https://e1k3unhdf2.execute-api.us-east-1.amazonaws.com/search"
PAGE_SIZE = 20        # API hard limit
RATE_LIMIT_SECS = 0.4
MAX_PAGES = 50        # 50 × 20 = 1000; stops if totalResults indicates fewer

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; ImpactDirectoryBot/1.0; "
        "+https://impact-products-directory.netlify.app)"
    )
}


def _fetch_all_businesses() -> list[dict]:
    """Paginate through all 1%FP business members. Returns raw API records."""
    all_results = []
    offset = 0
    total = None

    session = requests.Session()

    while True:
        resp = session.get(
            API_URL,
            params={"accountType": "business", "offset": offset, "limit": PAGE_SIZE},
            headers=HEADERS,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()

        if total is None:
            total = data.get("totalResults", 0)
            print(f"  1%FP API: {total} total businesses reported")

        batch = data.get("results", [])
        if not batch:
            break

        all_results.extend(batch)
        offset += len(batch)

        if offset >= total or offset >= MAX_PAGES * PAGE_SIZE:
            break

        time.sleep(RATE_LIMIT_SECS)

        if offset % 200 == 0:
            print(f"  ... fetched {offset}/{total}")

    return all_results


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


# Industry → cause_area mapping (rough)
_INDUSTRY_CAUSE = {
    "Food": "Environment & Sustainability",
    "Non-Alcoholic Beverage": "Environment & Sustainability",
    "Adult Beverage": "Environment & Sustainability",
    "Apparel": "Environment & Sustainability",
    "Outdoor & Recreation": "Environment & Sustainability",
    "Home & Garden": "Environment & Sustainability",
    "Housewares, Home Furnishings, and Accessories": "Environment & Sustainability",
    "Beauty & Personal Care": "Environment & Sustainability",
    "Health & Wellness": "Environment & Sustainability",
}


class OnePctPlanetImporter(BaseImporter):
    SOURCE_ID = "src-1pct-planet"
    SOURCE_URL = "https://directories.onepercentfortheplanet.org/?accountType=business"

    def fetch_raw(self) -> list[dict]:
        """Fetch all certified 1%FP business members from the public API."""
        results = _fetch_all_businesses()
        if not results:
            raise RuntimeError(
                "1% for the Planet API returned no business results. "
                "Check: " + API_URL + "?accountType=business"
            )
        print(f"  Fetched {len(results)} 1%FP certified businesses")
        return results

    def transform(self, raw: list[dict]) -> dict:
        today = self.today
        organizations, offerings, claims = [], [], []
        seen_slugs: set[str] = set()

        for biz in raw:
            name = (biz.get("name") or "").strip()
            if not name:
                continue

            slug = _slug(name)
            # Deduplicate slugs (rare name collisions)
            base_slug = slug
            counter = 2
            while slug in seen_slugs:
                slug = f"{base_slug}-{counter}"
                counter += 1
            seen_slugs.add(slug)

            org_id = self.make_org_id(slug)
            off_id = self.make_offering_id(f"{slug}-1pct")
            claim_id = self.make_claim_id(slug, "1pct-donation")

            industry = biz.get("industry") or ""
            address = biz.get("address") or ""
            snippet = (biz.get("snippet") or "").strip()
            uri = biz.get("uri") or ""

            # Country from address (last part after final comma)
            country = None
            if address:
                parts = [p.strip() for p in address.split(",")]
                if len(parts) >= 2:
                    country_raw = parts[-1]
                    # Short-form: "United States of America" → "US", etc.
                    if "United States" in country_raw:
                        country = "US"
                    elif "United Kingdom" in country_raw:
                        country = "GB"
                    elif country_raw in ("Canada", "CA"):
                        country = "CA"
                    elif country_raw in ("Australia",):
                        country = "AU"
                    elif country_raw in ("France",):
                        country = "FR"

            description = snippet or (
                f"{name} is a certified 1% for the Planet member, "
                "committing at least 1% of annual gross sales to approved "
                "environmental nonprofits."
            )

            cause_area = _INDUSTRY_CAUSE.get(industry, "Environment & Sustainability")

            tags = ["1pct-for-planet", "environment"]
            if industry:
                tags.append(_slug(industry))

            organizations.append({
                "id": org_id,
                "slug": slug,
                "name": name,
                "description": description,
                "website": None,  # Not available from API
                "org_type": "company",
                "country": country,
                "source_ids": [self.SOURCE_ID],
                "verified": False,
                "claimed": False,
                "tags": tags,
                "commitment_tier": "minimal",
                "industry": industry or None,
                "source_uri": uri,
                "added": today,
                "updated": today,
            })

            offerings.append({
                "id": off_id,
                "slug": f"{slug}-1pct",
                "name": f"{name} — 1% for the Planet",
                "org_id": org_id,
                "offering_type": "company",
                "exactness": "inferred",
                "category": industry or "1% for the Planet member",
                "description": (
                    f"{name} is a certified 1% for the Planet member. "
                    "The company donates at least 1% of annual gross sales to approved "
                    "environmental nonprofits."
                ),
                "tags": tags,
                "added": today,
                "updated": today,
            })

            claims.append({
                "id": claim_id,
                "offering_id": off_id,
                "org_id": org_id,
                "claim_type": "donation_percentage",
                "claim_text": (
                    "1% for the Planet members commit to give at least 1% of annual "
                    "gross sales to approved environmental nonprofit partners."
                ),
                "parsed_value": {"percentage": 1, "basis": "revenue"},
                "confidence": 0.85,
                "risk_level": "low",
                "source_id": self.SOURCE_ID,
                "beneficiary": "Approved environmental nonprofits (1% for the Planet)",
                "cause_area": cause_area,
                "impact_scope": "environment",
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
