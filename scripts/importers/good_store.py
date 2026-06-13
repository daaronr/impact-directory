"""
good_store.py — importer for Good Store (good.store).

Data source:
  https://good.store — Shopify storefront
  Shopify JSON API: https://good.store/collections/all/products.json

Good Store model:
  Good Store sells products from its own house brands, donating 100% of profits
  to charity. As of 2026 they have donated over $12 million to charity.

  Site claim: "We're searching the world for the best versions of the products
  that you use daily, made by the best people, and then we're giving all of
  the profits from those products away to those who need it."

  Four current brands across eight searchable product categories:
    Awesome Socks Club  → Socks, Underwear
    Keats & Co.         → Coffee, Tea
    Sun Basin Soap      → Soap & bath, Shampoo bars, Candles
    EcoGeek             → Household cleaning

  One org entry + one offering per product category, so a user searching
  "coffee" or "soap" or "cleaning products" finds Good Store.
"""

import re
import requests

from .base_importer import BaseImporter

SOURCE_URL = "https://good.store"
PRODUCTS_URL = "https://good.store/collections/all/products.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; ImpactDirectoryBot/1.0; "
        "+https://impact-products-directory.netlify.app)"
    )
}

SITE_CLAIM_TEXT = (
    "We're searching the world for the best versions of the products that you "
    "use daily, made by the best people, and then we're giving all of the "
    "profits from those products away to those who need it."
)

ASC_CLAIM_TEXT = (
    "Since you need to buy socks, you might as well do it in a way that brings "
    "a little joy to your doorstep every month, supports independent artists, "
    "and donates 100% of the profit to charity."
)

# One entry per searchable product category.
# `vendor` + `product_types` determine which Shopify products fall in each bucket.
# `product_types` is a set of Shopify product_type values (case-insensitive match).
CATEGORIES = [
    {
        "slug_suffix": "coffee",
        "name": "Coffee — Good Store",
        "category": "Food & Drink",
        "tags": [
            "coffee", "subscriptions", "specialty-coffee", "single-origin",
            "coffee-pods", "coffee-subscription", "100pct-profits",
        ],
        "description": (
            "Specialty coffee subscriptions (monthly, 6-month, 12-month prepaid) "
            "and compostable single-serve pods from Keats & Co., sold through "
            "Good Store. 100% of profits donated to charity."
        ),
        "vendor": "Keats & Co.",
        "product_types": {"coffee"},
        "claim_text": SITE_CLAIM_TEXT,
        "exactness": "collection",
    },
    {
        "slug_suffix": "tea",
        "name": "Tea — Good Store",
        "category": "Food & Drink",
        "tags": [
            "tea", "loose-leaf", "loose-leaf-tea", "herbal-tea", "green-tea",
            "black-tea", "chai", "caffeine-free", "100pct-profits",
        ],
        "description": (
            "Loose-leaf teas — black, green, herbal, chai — from Keats & Co., "
            "sold through Good Store. 100% of profits donated to charity."
        ),
        "vendor": "Keats & Co.",
        "product_types": {"tea"},
        "claim_text": SITE_CLAIM_TEXT,
        "exactness": "collection",
    },
    {
        "slug_suffix": "socks",
        "name": "Socks — Good Store",
        "category": "Clothing & Accessories",
        "tags": [
            "socks", "clothing", "subscriptions", "artist-designed",
            "compression-socks", "monthly-subscription", "100pct-profits",
        ],
        "description": (
            "Artist-designed socks (monthly subscription or individual pairs, "
            "including compression socks benefiting Partners in Health) from "
            "Awesome Socks Club, sold through Good Store. 100% of profits "
            "donated to charity."
        ),
        "vendor": "Awesome Socks Club",
        "product_types": {"socks"},
        "claim_text": ASC_CLAIM_TEXT,
        "exactness": "exact",
    },
    {
        "slug_suffix": "underwear",
        "name": "Underwear — Good Store",
        "category": "Clothing & Accessories",
        "tags": ["underwear", "subscriptions", "monthly-subscription", "100pct-profits"],
        "description": (
            "Underwear subscriptions (Awesome Undies Club) from Awesome Socks "
            "Club, sold through Good Store. 100% of profits donated to charity."
        ),
        "vendor": "Awesome Socks Club",
        "product_types": {"underwear"},
        "claim_text": ASC_CLAIM_TEXT,
        "exactness": "exact",
    },
    {
        "slug_suffix": "soap-bath",
        "name": "Soap & bath — Good Store",
        "category": "Beauty & Personal Care",
        "tags": [
            "soap", "bar-soap", "bath", "bath-bomb", "artisan-soap",
            "natural-soap", "100pct-profits",
        ],
        "description": (
            "Artisan bar soaps and bath bombs from Sun Basin Soap, "
            "sold through Good Store. 100% of profits donated to charity."
        ),
        "vendor": "Sun Basin Soap",
        "product_types": {"soap"},
        "claim_text": SITE_CLAIM_TEXT,
        "exactness": "collection",
    },
    {
        "slug_suffix": "shampoo-bars",
        "name": "Shampoo bars — Good Store",
        "category": "Beauty & Personal Care",
        "tags": [
            "shampoo", "shampoo-bar", "solid-shampoo", "hair-care",
            "plastic-free", "100pct-profits",
        ],
        "description": (
            "Solid shampoo bars (plastic-free) from Sun Basin Soap, "
            "sold through Good Store. 100% of profits donated to charity."
        ),
        "vendor": "Sun Basin Soap",
        "product_types": {"shampoo"},
        "claim_text": SITE_CLAIM_TEXT,
        "exactness": "collection",
    },
    {
        "slug_suffix": "candles",
        "name": "Candles — Good Store",
        "category": "Home & Living",
        "tags": ["candles", "scented-candles", "home-fragrance", "100pct-profits"],
        "description": (
            "Scented candles from Sun Basin Soap, sold through Good Store. "
            "100% of profits donated to charity."
        ),
        "vendor": "Sun Basin Soap",
        "product_types": {"candle"},
        "claim_text": SITE_CLAIM_TEXT,
        "exactness": "collection",
    },
    {
        "slug_suffix": "household-cleaning",
        "name": "Household cleaning — Good Store",
        "category": "Household & Cleaning",
        "tags": [
            "cleaning", "household", "eco-friendly", "dishwasher-tablets",
            "laundry", "cleaning-tabs", "biodegradable", "zero-waste",
            "cleaning-products", "100pct-profits",
        ],
        "description": (
            "Eco-friendly household cleaning products — cleaning tabs, "
            "dishwasher tablets and powder, laundry dryer sheets, scrub "
            "brushes, spray bottles — from EcoGeek, sold through Good Store. "
            "100% of profits donated to charity."
        ),
        "vendor": "EcoGeek",
        "product_types": {"cleaning", "dishwashing", "laundry", "accessory"},
        "claim_text": SITE_CLAIM_TEXT,
        "exactness": "collection",
    },
]

# Product types to ignore entirely (meta/admin Shopify items)
SKIP_TYPES = {"bundle", "gift card", "gift note", "donation", "enamel pin", "merch"}
SKIP_VENDORS = {"Giftnote", "Giftnote Surcharge"}


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _count_by_category(products: list[dict]) -> dict[str, int]:
    """Count products per category slug."""
    counts: dict[str, int] = {}
    for p in products:
        vendor = p.get("vendor", "")
        ptype = (p.get("product_type") or "").lower()
        if vendor in SKIP_VENDORS or ptype in SKIP_TYPES:
            continue
        for cat in CATEGORIES:
            if vendor == cat["vendor"] and ptype in cat["product_types"]:
                counts[cat["slug_suffix"]] = counts.get(cat["slug_suffix"], 0) + 1
                break
    return counts


def _find_asc_claim(products: list[dict]) -> str | None:
    for p in products:
        title = (p.get("title") or "").lower()
        if "awesome socks club" in title and "subscription" in title:
            body = re.sub(r"<[^>]+>", " ", p.get("body_html") or "")
            body = re.sub(r"\s+", " ", body).strip()
            m = re.search(r"[^.]*100%[^.]*profit[^.]*\.", body, re.IGNORECASE)
            if m:
                return m.group(0).strip()
    return None


class GoodStoreImporter(BaseImporter):
    SOURCE_ID = "src-good-store"
    SOURCE_URL = SOURCE_URL

    def fetch_raw(self) -> dict:
        try:
            resp = requests.get(
                PRODUCTS_URL, params={"limit": 250}, headers=HEADERS, timeout=20
            )
            resp.raise_for_status()
            products = resp.json().get("products", [])
            print(f"  Fetched {len(products)} products from Good Store Shopify API")
        except Exception as e:
            print(f"  WARNING: Could not fetch products ({e}). Using zero counts.")
            products = []

        asc_claim = _find_asc_claim(products)
        if asc_claim:
            print(f"  Found ASC claim text: {asc_claim[:80]}...")
            for cat in CATEGORIES:
                if cat["vendor"] == "Awesome Socks Club":
                    cat["claim_text"] = asc_claim

        return {
            "products": products,
            "counts": _count_by_category(products),
        }

    def transform(self, raw: dict) -> dict:
        today = self.today
        organizations, offerings, claims = [], [], []

        counts = raw.get("counts", {})
        total_products = sum(counts.values())

        org_slug = "good-store"
        org_id = self.make_org_id(org_slug)

        organizations.append({
            "id": org_id,
            "slug": org_slug,
            "name": "Good Store",
            "description": (
                "Good Store is an online shop that donates 100% of profits to charity "
                f"({total_products} products across 4 brands). Has donated over $12 "
                "million to charity. Sells: coffee, tea, socks, underwear, soap, "
                "shampoo bars, candles, and eco household cleaning products."
            ),
            "website": "https://good.store",
            "org_type": "company",
            "country": "US",
            "source_ids": [self.SOURCE_ID],
            "verified": False,
            "claimed": False,
            "tags": [
                "100pct-profits", "effective-giving", "subscriptions",
                "coffee", "tea", "socks", "soap", "cleaning",
            ],
            "commitment_tier": "substantial",
            "added": today,
            "updated": today,
        })

        for cat in CATEGORIES:
            off_slug = f"{org_slug}-{cat['slug_suffix']}"
            off_id = self.make_offering_id(off_slug)
            claim_id = self.make_claim_id(off_slug, "donation")

            count = counts.get(cat["slug_suffix"], 0)
            count_str = f" ({count} products)" if count else ""

            offerings.append({
                "id": off_id,
                "slug": off_slug,
                "name": cat["name"],
                "org_id": org_id,
                "offering_type": "product_family",
                "exactness": cat["exactness"],
                "category": cat["category"],
                "description": cat["description"] + (
                    f" {count} products available." if count else ""
                ),
                "tags": cat["tags"],
                "added": today,
                "updated": today,
            })

            claims.append({
                "id": claim_id,
                "offering_id": off_id,
                "org_id": org_id,
                "claim_type": "donation_percentage",
                "claim_text": cat["claim_text"],
                "parsed_value": {"percentage": 100, "basis": "profits"},
                "confidence": 0.92,
                "risk_level": "low",
                "source_id": self.SOURCE_ID,
                "beneficiary": "Charitable organisations (Good Store)",
                "cause_area": "Effective Giving",
                "impact_scope": "good-store",
                "status": "active",
                "valid_from": None,
                "valid_until": None,
                "added": today,
                "updated": today,
            })

        print(
            f"  Mapped {len(organizations)} orgs / {len(offerings)} offerings "
            f"/ {len(claims)} claims ({total_products} products across "
            f"{len(CATEGORIES)} categories)."
        )
        return {
            "organizations": organizations,
            "offerings": offerings,
            "claims": claims,
        }
