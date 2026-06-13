"""
ea_services.py — importer for the EASE (EA Services) directory.

Source: https://ea-services.org

The page is static HTML (no JS framework). Each provider entry has:
  - Name:    <h3 class="card-title">NAME</h3>
  - Areas:   <p class="card-text"><strong>Areas:</strong> area1, area2, ...</p>
  - Bio:     <p class="card-text"><strong>Bio:</strong> description</p>
  - Website: <p class="card-text card-icon card-website"><a href="URL">...</a></p>

Schema mapping:
  - org_type: "service_provider"
  - offering_type: "service"
  - claim_type: "ea_affiliation"  (listed as EA-aligned service provider)
  - confidence: 0.75  (self-reported / directory-listed, not independently verified)
  - risk_level: "low"
  - source_id: "src-ea-services"
"""

import re
import requests

from .base_importer import BaseImporter

SOURCE_URL = "https://ea-services.org"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; ImpactDirectoryBot/1.0; "
        "+https://impact-products-directory.netlify.app)"
    )
}


def _strip_tags(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html)


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", _strip_tags(text)).strip().strip(",").strip()


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _parse_entries(html: str) -> list[dict]:
    """Split HTML on card-title h3 tags and parse each provider entry."""
    # Find the directory section
    dir_start = html.find('id="the-directory"')
    if dir_start < 0:
        dir_start = 0
    dir_html = html[dir_start:]

    # Split on each provider's name heading
    chunks = re.split(r'(?=<h3 class="card-title">)', dir_html)

    entries = []
    for chunk in chunks[1:]:  # skip preamble before first entry
        # Name
        name_m = re.search(r'<h3 class="card-title">(.*?)</h3>', chunk, re.DOTALL)
        if not name_m:
            continue
        name = _clean(name_m.group(1))
        if not name:
            continue

        # Areas
        areas_m = re.search(
            r'<strong>Areas:</strong>(.*?)</p>', chunk, re.DOTALL
        )
        areas_raw = areas_m.group(1) if areas_m else ""
        areas = [
            a.strip()
            for a in re.split(r",\s*", _clean(areas_raw))
            if a.strip()
        ]

        # Bio
        bio_m = re.search(
            r'<strong>Bio:</strong>(.*?)</p>', chunk, re.DOTALL
        )
        bio = _clean(bio_m.group(1)) if bio_m else ""

        # Website — class="card-website"
        website_m = re.search(
            r'card-icon card-website[^>]*>.*?<a\s+href="([^"]+)"', chunk, re.DOTALL
        )
        website = website_m.group(1).strip() if website_m else None
        # Skip mailto and relative links
        if website and (website.startswith("mailto:") or website.startswith("/")):
            website = None

        entries.append({
            "name": name,
            "website": website,
            "bio": bio,
            "areas": areas,
        })

    return entries


class EAServicesImporter(BaseImporter):
    SOURCE_ID = "src-ea-services"
    SOURCE_URL = SOURCE_URL

    def fetch_raw(self) -> list[dict]:
        """Fetch ea-services.org and parse all provider entries."""
        resp = requests.get(SOURCE_URL, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        entries = _parse_entries(resp.text)
        if not entries:
            raise RuntimeError(
                "Parsed zero entries from ea-services.org. "
                "The page structure may have changed."
            )
        print(f"  Parsed {len(entries)} provider entries from EASE.")
        return entries

    def transform(self, raw: list[dict]) -> dict:
        today = self.today
        organizations, offerings, claims = [], [], []

        for entry in raw:
            name = entry["name"]
            slug = _slug(name)
            org_id = self.make_org_id(slug)
            off_id = self.make_offering_id(f"{slug}-ease")
            claim_id = self.make_claim_id(slug, "ea-affiliation")

            areas = entry.get("areas", [])
            # Normalise area tags: lowercase, hyphenated
            tags = list({re.sub(r"[^a-z0-9]+", "-", a.lower()).strip("-") for a in areas})
            tags.append("ea-services")

            # Pick primary category from first area (or fallback)
            category = areas[0].title() if areas else "EA-Aligned Service"

            organizations.append({
                "id": org_id,
                "slug": slug,
                "name": name,
                "description": entry.get("bio") or (
                    f"{name} is an EA-aligned service provider listed in the EASE directory."
                ),
                "website": entry.get("website"),
                "org_type": "service_provider",
                "country": None,
                "source_ids": [self.SOURCE_ID],
                "verified": False,
                "claimed": False,
                "tags": tags,
                "added": today,
                "updated": today,
            })

            offerings.append({
                "id": off_id,
                "slug": f"{slug}-ease",
                "name": f"{name} — EA Services",
                "org_id": org_id,
                "offering_type": "service",
                "exactness": "collection",
                "category": category,
                "description": (
                    f"Services offered: {', '.join(areas)}. " + (entry.get("bio") or "")
                ).strip(),
                "tags": tags,
                "added": today,
                "updated": today,
            })

            claims.append({
                "id": claim_id,
                "offering_id": off_id,
                "org_id": org_id,
                "claim_type": "ea_affiliation",
                "claim_text": (
                    f"{name} is listed in the EASE directory as an EA-aligned "
                    "service provider offering services to effective altruism organisations."
                ),
                "parsed_value": {"areas": areas},
                "confidence": 0.75,
                "risk_level": "low",
                "source_id": self.SOURCE_ID,
                "beneficiary": "EA-aligned organisations",
                "cause_area": "Effective Altruism",
                "impact_scope": "ea-ecosystem",
                "status": "active",
                "valid_from": None,
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
