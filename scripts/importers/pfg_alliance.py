"""
pfg_alliance.py — importer for Profit for Good Alliance partners.

Data source:
  https://profitforgood.com — Profit for Good Alliance homepage
  Founded by Peter Singer and Julia van Boven (The School for Moral Ambition).
  Launched at the Profit for Good Conference, June 2025.

  The page has two sections of partners:

  FOUNDING PARTNERS (with narrative profiles):
    - Rituals Cosmetics   10% of annual net profits to wellbeing/environment causes
    - Who Gives a Crap    50% of profits to water and sanitation charities

  FIRST MEMBERS (external links on page as of 2026-04):
    Original:
    - Impact Makers       100% nonprofit-owned; IT consulting
    - Newman's Own        100% of profits to charity ($600M+ donated)
    - Oma's Soep          Dutch social enterprise; all profits to good causes
    - Give Industries     Australian profit-for-good company
    - Climax Change       Climate-focused profit-for-good
    - BRAC USA            World's largest development org; poverty alleviation
    - EarthWater          Dutch social enterprise; water-access projects
    - Secrid              Dutch wallet company; profits directed to charity
    Newer additions:
    - Humanitix           100% of booking-fee profits to education charities
    - Albion East         10% of profits (GWWC Company Pledge)
    - Postcode Loterij    Dutch national charity lottery; ~50% proceeds to charity

  Note: Rituals, Who Gives a Crap, and Humanitix are already in organizations.json.
  Duplicate org entries from this importer will be deduped away by consolidate.py
  (alphabetical file load order means organizations.json wins), but their
  PFG Alliance offerings and claims are still added as new entries.

Schema mapping:
  - org_type: "company" (or "nonprofit" for BRAC USA)
  - commitment_tier: "substantial"
  - confidence: 0.85-0.92 depending on claim specificity
  - source_id: "src-profit-for-good-alliance"
"""

import re
import requests

from .base_importer import BaseImporter

SOURCE_URL = "https://profitforgood.com"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; ImpactDirectoryBot/1.0; "
        "+https://impact-products-directory.netlify.app)"
    )
}

ALL_PARTNERS = [
    # ── Founding Partners ──────────────────────────────────────────────────────
    {
        "name": "Rituals Cosmetics",
        "website": "https://www.rituals.com",
        "description": (
            "Netherlands-based wellness and beauty brand (1400+ stores, 33 countries). "
            "In 2024, introduced a 10% Profit Pledge: a long-term commitment to dedicate "
            "at least 10% of annual net profits to wellbeing of people and planet. "
            "Expected to amount to €300M over the next ten years."
        ),
        "claim_text": (
            "Rituals introduced the 10% Profit Pledge: a long-term commitment to "
            "dedicate at least 10% of its annual net profits to initiatives that help "
            "improve the wellbeing of people and planet."
        ),
        "claim_type": "donation_percentage",
        "parsed_value": {"percentage": 10, "basis": "net_profits"},
        "confidence": 0.90,
        "org_type": "company",
        "country": "NL",
        "cause_area": "Social Impact",
    },
    {
        "name": "Who Gives a Crap",
        "website": "https://whogivesacrap.org",
        "description": (
            "Toilet paper and paper products company (recycled/bamboo). Donates 50% of "
            "profits to charities providing toilets and clean water. $14M+ donated to date, "
            "products available in 36 countries."
        ),
        "claim_text": (
            "50% of profits donated! We invest a lot (like 50% a lot) in helping to make "
            "a difference while making the most eco-friendly products we can."
        ),
        "claim_type": "donation_percentage",
        "parsed_value": {"percentage": 50, "basis": "profits"},
        "confidence": 0.92,
        "org_type": "company",
        "country": "AU",
        "cause_area": "Global Health & Poverty",
    },
    # ── First Members — original 8 ─────────────────────────────────────────────
    {
        "name": "Impact Makers",
        "website": "https://impactmakers.com/",
        "description": (
            "IT and management consulting company 100% owned by a nonprofit. "
            "All profits flow to charitable causes."
        ),
        "claim_text": "Impact Makers is 100% nonprofit-owned; all profits go to charity.",
        "claim_type": "ownership",
        "parsed_value": {"percentage": 100, "basis": "profits"},
        "confidence": 0.88,
        "org_type": "company",
        "country": "US",
        "cause_area": "Effective Giving",
    },
    {
        "name": "Newman's Own",
        "website": "https://newmansown.org/",
        "description": (
            "Food and beverage company founded by Paul Newman. Has donated over $600M "
            "to charity. 100% of royalties and profits go to the Newman's Own Foundation."
        ),
        "claim_text": (
            "Newman's Own donates 100% of profits to charity — "
            "all royalties and profits go to the Newman's Own Foundation."
        ),
        "claim_type": "ownership",
        "parsed_value": {"percentage": 100, "basis": "profits"},
        "confidence": 0.92,
        "org_type": "company",
        "country": "US",
        "cause_area": "Effective Giving",
    },
    {
        "name": "Oma's Soep",
        "website": "https://omassoep.nl/",
        "description": (
            "Dutch social enterprise selling soup; all profits donated to good causes."
        ),
        "claim_text": "All profits from Oma's Soep are donated to charity.",
        "claim_type": "ownership",
        "parsed_value": {"percentage": 100, "basis": "profits"},
        "confidence": 0.82,
        "org_type": "company",
        "country": "NL",
        "cause_area": "Effective Giving",
    },
    {
        "name": "Give Industries",
        "website": "https://www.giveindustries.com.au/",
        "description": (
            "Australian Profit for Good company whose commercial activities fund "
            "charitable giving."
        ),
        "claim_text": (
            "Give Industries is a Profit for Good Alliance founding partner "
            "committed to directing profits to effective causes."
        ),
        "claim_type": "ownership",
        "parsed_value": {},
        "confidence": 0.80,
        "org_type": "company",
        "country": "AU",
        "cause_area": "Effective Giving",
    },
    {
        "name": "Climax Change",
        "website": "https://climaxchange.com/",
        "description": (
            "Profit for Good company whose ownership structure directs profits "
            "to climate-related charities."
        ),
        "claim_text": (
            "Climax Change is a Profit for Good Alliance partner "
            "with profits directed to effective climate charities."
        ),
        "claim_type": "ownership",
        "parsed_value": {},
        "confidence": 0.80,
        "org_type": "company",
        "country": None,
        "cause_area": "Climate & Environment",
    },
    {
        "name": "BRAC USA",
        "website": "https://www.bracusa.org/",
        "description": (
            "US fundraising arm of BRAC, one of the world's largest development "
            "organisations. Raises funds for poverty alleviation programs globally."
        ),
        "claim_text": (
            "BRAC USA is a founding partner of the Profit for Good Alliance, "
            "representing BRAC's mission to combat poverty at scale."
        ),
        "claim_type": "ownership",
        "parsed_value": {},
        "confidence": 0.82,
        "org_type": "nonprofit",
        "country": "US",
        "cause_area": "Global Health & Poverty",
    },
    {
        "name": "EarthWater",
        "website": "https://earthwater.nl/",
        "description": (
            "Dutch social enterprise selling water products and directing profits "
            "to charitable water-access projects."
        ),
        "claim_text": (
            "EarthWater is a Profit for Good Alliance partner "
            "directing profits to water access charities."
        ),
        "claim_type": "ownership",
        "parsed_value": {},
        "confidence": 0.80,
        "org_type": "company",
        "country": "NL",
        "cause_area": "Global Health & Poverty",
    },
    {
        "name": "Secrid",
        "website": "https://secrid.com/",
        "description": (
            "Dutch slim-wallet company and Profit for Good Alliance partner, "
            "directing a share of profits to effective charities."
        ),
        "claim_text": (
            "Secrid is a founding partner of the Profit for Good Alliance, "
            "committed to directing profits to highly effective causes."
        ),
        "claim_type": "ownership",
        "parsed_value": {},
        "confidence": 0.80,
        "org_type": "company",
        "country": "NL",
        "cause_area": "Effective Giving",
    },
    # ── First Members — newer additions ───────────────────────────────────────
    {
        "name": "Humanitix",
        "website": "https://humanitix.com",
        "description": (
            "Event ticketing platform (Eventbrite alternative) that dedicates 100% of "
            "booking-fee profits to education charities supporting disadvantaged children. "
            "£8.5M+ donated to charity."
        ),
        "claim_text": (
            "Humanitix: Tickets for good, not greed. 100% of booking fee profits "
            "create real-world impact. 100% of profits are dedicated to charity."
        ),
        "claim_type": "donation_percentage",
        "parsed_value": {"percentage": 100, "basis": "booking_fee_profits"},
        "confidence": 0.92,
        "org_type": "company",
        "country": "AU",
        "cause_area": "Education & Children",
    },
    {
        "name": "Albion East",
        "website": "https://www.albioneast.com/",
        "description": (
            "International consultancy serving philanthropic foundations and high-impact "
            "charities. Has taken the GWWC Companies Pledge to donate at least 10% of "
            "profits to highly effective charities (e.g. Against Malaria Foundation)."
        ),
        "claim_text": (
            "In line with our values, we have taken the Companies Pledge to donate at "
            "least 10% of our profits to highly effective charities."
        ),
        "claim_type": "pledge",
        "parsed_value": {"percentage": 10, "basis": "profits"},
        "confidence": 0.88,
        "org_type": "company",
        "country": "GB",
        "cause_area": "Effective Giving",
    },
    {
        "name": "Postcode Loterij",
        "website": "https://www.postcodeloterij.nl/",
        "description": (
            "Dutch National Postcode Lottery. ~50% of ticket proceeds go directly to "
            "charitable causes. One of the largest private funders of NGOs in the "
            "Netherlands; distributes hundreds of millions of euros to charities annually."
        ),
        "claim_text": (
            "Postcode Loterij: approximately 50% of lottery ticket proceeds are "
            "distributed to charitable organisations."
        ),
        "claim_type": "donation_percentage",
        "parsed_value": {"percentage": 50, "basis": "revenue"},
        "confidence": 0.85,
        "org_type": "company",
        "country": "NL",
        "cause_area": "Social Impact",
    },
]


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _verify_partners_present(html: str) -> int:
    count = 0
    for partner in ALL_PARTNERS:
        domain = re.sub(r"https?://(?:www\.)?", "", partner["website"]).rstrip("/")
        if domain in html:
            count += 1
    return count


class PFGAllianceImporter(BaseImporter):
    SOURCE_ID = "src-profit-for-good-alliance"
    SOURCE_URL = SOURCE_URL

    def fetch_raw(self) -> list[dict]:
        try:
            resp = requests.get(SOURCE_URL, headers=HEADERS, timeout=20)
            resp.raise_for_status()
            found = _verify_partners_present(resp.text)
            print(
                f"  PFG Alliance homepage live; found {found}/{len(ALL_PARTNERS)} "
                "partner links"
            )
            if found < 5:
                print(
                    "  WARNING: Fewer than 5 partner links found — page structure "
                    "may have changed. Proceeding with hardcoded list."
                )
        except Exception as e:
            print(
                f"  WARNING: Could not fetch PFG Alliance homepage ({e}). "
                "Proceeding with hardcoded partner list."
            )
        return ALL_PARTNERS

    def transform(self, raw: list[dict]) -> dict:
        today = self.today
        organizations, offerings, claims = [], [], []

        for partner in raw:
            name = partner["name"]
            slug = _slug(name)
            org_id = self.make_org_id(slug)
            off_id = self.make_offering_id(f"{slug}-pfg-alliance")
            claim_id = self.make_claim_id(slug, "pfg-alliance")

            organizations.append({
                "id": org_id,
                "slug": slug,
                "name": name,
                "description": partner["description"],
                "website": partner["website"],
                "org_type": partner["org_type"],
                "country": partner.get("country"),
                "source_ids": [self.SOURCE_ID],
                "verified": False,
                "claimed": False,
                "tags": ["profit-for-good", "pfg-alliance"],
                "commitment_tier": "substantial",
                "added": today,
                "updated": today,
            })

            offerings.append({
                "id": off_id,
                "slug": f"{slug}-pfg-alliance",
                "name": f"{name} — Profit for Good Alliance",
                "org_id": org_id,
                "offering_type": partner["org_type"],
                "exactness": "inferred",
                "category": "Profit for Good company",
                "description": partner["description"],
                "tags": ["profit-for-good", "pfg-alliance"],
                "added": today,
                "updated": today,
            })

            claims.append({
                "id": claim_id,
                "offering_id": off_id,
                "org_id": org_id,
                "claim_type": partner["claim_type"],
                "claim_text": partner["claim_text"],
                "parsed_value": partner.get("parsed_value", {}),
                "confidence": partner["confidence"],
                "risk_level": "low",
                "source_id": self.SOURCE_ID,
                "beneficiary": "Charitable causes (Profit for Good Alliance)",
                "cause_area": partner["cause_area"],
                "impact_scope": "pfg-alliance",
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
