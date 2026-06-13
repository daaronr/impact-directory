"""
profit_for_good.py — importer for the Profit for Good Initiative directory.

Sources tried in order:
  1. https://profitforgood.info           (primary, currently intermittent)
  2. https://www.profitforgood.com        (alternate domain)
  3. https://profitforgoodinitiative.org  (another possible alias)

What this scrapes:
  - Main directory page: list of companies with name, short blurb, and link.
  - Company detail page: charitable commitment text (exact wording), beneficiary
    organisations, giving structure (% of profits / ownership), website URL.

HTML structure (as of 2025 crawl):
  - Company cards on the directory page use a consistent card/list structure.
  - Detail pages include a "commitment" or "giving" section with structured text.

Implementation notes:
  - Uses stdlib html.parser (no BeautifulSoup dependency).
  - Respects rate limiting: 1.5 s between requests.
  - confidence=0.85 for PFG-sourced claims (third-party directory, not primary).
  - risk_level="medium" unless ownership transfer is confirmed ("low").
  - claim_type="ownership" if entry describes foundation/ownership model;
    "donation_percentage" otherwise.
"""

import json
import re
import time
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

import requests

from .base_importer import BaseImporter

CANDIDATE_URLS = [
    # NOTE: profitforgood.com is the movement landing page (logos only, not a directory)
    # NOTE: profitforgood.info was the actual company directory — currently DNS-dead
    "https://profitforgood.info",
    "https://profitforgoodinitiative.org",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; ImpactDirectoryBot/1.0; "
        "+https://impact-products-directory.netlify.app)"
    )
}

RATE_LIMIT_SECS = 1.5
REQUEST_TIMEOUT = 20


class _TextExtractor(HTMLParser):
    """Extracts plain text from an HTML snippet."""

    def __init__(self):
        super().__init__()
        self._text = []

    def handle_data(self, data):
        self._text.append(data)

    def get_text(self) -> str:
        return " ".join(self._text).strip()


class _LinkExtractor(HTMLParser):
    """Extracts (href, text) pairs from anchor tags."""

    def __init__(self, base_url: str = ""):
        super().__init__()
        self.base_url = base_url
        self.links: list[tuple[str, str]] = []
        self._current_href: str | None = None
        self._buf: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            attrs_dict = dict(attrs)
            href = attrs_dict.get("href", "")
            if href:
                self._current_href = urljoin(self.base_url, href)
            self._buf = []

    def handle_endtag(self, tag):
        if tag == "a" and self._current_href:
            text = " ".join(self._buf).strip()
            self.links.append((self._current_href, text))
            self._current_href = None
            self._buf = []

    def handle_data(self, data):
        if self._current_href is not None:
            self._buf.append(data)


def _get(url: str, session: requests.Session) -> requests.Response | None:
    """GET with error handling; returns None on connection/DNS errors."""
    try:
        resp = session.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return resp
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
        print(f"  Connection error for {url}: {e}")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"  HTTP error for {url}: {e}")
        return None


def _find_live_base(session: requests.Session) -> tuple[str, str] | None:
    """Try candidate URLs; return (base_url, html) for the first live one."""
    for url in CANDIDATE_URLS:
        print(f"  Trying {url} ...")
        resp = _get(url, session)
        if resp is not None:
            print(f"  Found live site at {url}")
            return url, resp.text
    return None


def _extract_company_links(html: str, base_url: str) -> list[str]:
    """
    Extract company detail page URLs from the directory listing page.

    The PFG directory shows company cards; each links to a detail page.
    We look for internal links that look like company pages.
    """
    parser = _LinkExtractor(base_url)
    parser.feed(html)

    parsed_base = urlparse(base_url)
    company_urls = []
    seen = set()

    for href, _text in parser.links:
        parsed = urlparse(href)
        # Internal links only; skip homepage, anchors, mailto, etc.
        if parsed.netloc not in ("", parsed_base.netloc):
            continue
        if not parsed.path or parsed.path in ("/", ""):
            continue
        # Skip clearly non-company paths
        path = parsed.path.rstrip("/")
        skip_patterns = [
            "/about", "/contact", "/blog", "/news", "/faq",
            "/privacy", "/terms", "/login", "/register", "/search",
            "/category", "/tag", "/page/",
        ]
        if any(path.startswith(p) for p in skip_patterns):
            continue
        if href not in seen:
            seen.add(href)
            company_urls.append(href)

    return company_urls


def _scrape_company_detail(html: str, url: str) -> dict | None:
    """
    Parse a company detail page and return a dict with:
      name, website, description, commitment_text, giving_pct, claim_type,
      beneficiary, cause_area
    Returns None if the page doesn't look like a company entry.
    """
    # Extract page title as company name fallback
    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    page_title = title_match.group(1).strip() if title_match else ""
    # Strip site name suffix (e.g. "Acme Corp – Profit for Good")
    name = re.sub(r"\s*[–|-]\s*Profit.*$", "", page_title, flags=re.IGNORECASE).strip()
    if not name:
        return None

    # Look for the company's own website URL in the page content
    # PFG detail pages typically include a "Visit website" or similar link
    # to the company's own domain (not profitforgood.*)
    pfg_domain = urlparse(url).netloc
    link_parser = _LinkExtractor(url)
    link_parser.feed(html)

    website = None
    for href, text in link_parser.links:
        parsed = urlparse(href)
        if parsed.netloc and parsed.netloc != pfg_domain and parsed.scheme in ("http", "https"):
            # Heuristic: prefer links with "visit" or "website" in anchor text
            if any(kw in text.lower() for kw in ("visit", "website", "site", "homepage")):
                website = href
                break

    # Extract commitment / giving text — look for common section headings
    commitment_text = ""
    for pattern in [
        r"(?:commitment|giving commitment|charitable commitment|donation)[^<]*</[^>]+>\s*<[^>]+>([^<]{30,})",
        r"(?:gives?|donates?|pledges?|commits?)[^.]{10,200}\.",
    ]:
        m = re.search(pattern, html, re.IGNORECASE)
        if m:
            raw = m.group(1) if m.lastindex else m.group(0)
            extractor = _TextExtractor()
            extractor.feed(raw)
            commitment_text = extractor.get_text()
            if len(commitment_text) > 20:
                break

    # Infer giving percentage from commitment text
    pct_match = re.search(r"(\d+(?:\.\d+)?)\s*%\s+of\s+(?:net\s+)?(?:profits?|revenue|sales)", commitment_text, re.IGNORECASE)
    giving_pct = float(pct_match.group(1)) if pct_match else None

    # Determine claim type
    ownership_keywords = ["100% owned", "foundation owned", "employee owned", "transferred ownership"]
    claim_type = "ownership" if any(kw in commitment_text.lower() for kw in ownership_keywords) else "donation_percentage"

    # Risk level
    risk_level = "low" if claim_type == "ownership" else "medium"

    return {
        "name": name,
        "website": website,
        "description": "",  # will be set from commitment_text or left minimal
        "commitment_text": commitment_text or f"{name} is listed in the Profit for Good directory.",
        "giving_pct": giving_pct,
        "claim_type": claim_type,
        "risk_level": risk_level,
        "beneficiary": "Charitable organisations (Profit for Good directory)",
        "cause_area": "Effective Giving",
    }


def _slug(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s


class ProfitForGoodImporter(BaseImporter):
    SOURCE_ID = "src-profit-for-good"
    SOURCE_URL = "https://profitforgood.info"

    def fetch_raw(self) -> dict:
        """
        Attempt to fetch the PFG directory.
        Returns {"base_url": str, "companies": list[dict]}.
        Raises RuntimeError if no live site is found.
        """
        session = requests.Session()
        result = _find_live_base(session)

        if result is None:
            raise RuntimeError(
                "Profit for Good website is not reachable. Tried: "
                + ", ".join(CANDIDATE_URLS)
                + "\nThe site may be temporarily down. Try again later, or "
                "check https://status.profitforgood.info or the Wayback Machine."
            )

        base_url, index_html = result
        print(f"  Extracting company links from {base_url} ...")
        company_urls = _extract_company_links(index_html, base_url)
        print(f"  Found {len(company_urls)} candidate company URLs")

        companies = []
        for i, url in enumerate(company_urls, 1):
            time.sleep(RATE_LIMIT_SECS)
            resp = _get(url, session)
            if resp is None:
                continue
            detail = _scrape_company_detail(resp.text, url)
            if detail:
                detail["source_url"] = url
                companies.append(detail)
                print(f"  [{i}/{len(company_urls)}] {detail['name']}")
            else:
                print(f"  [{i}/{len(company_urls)}] skipped (not a company page): {url}")

        print(f"  Scraped {len(companies)} companies from Profit for Good")
        return {"base_url": base_url, "companies": companies}

    def transform(self, raw: dict) -> dict:
        today = self.today
        organizations, offerings, claims = [], [], []

        for company in raw.get("companies", []):
            name = company["name"]
            if not name:
                continue

            slug = _slug(name)
            org_id = self.make_org_id(slug)
            off_id = self.make_offering_id(f"{slug}-pfg")
            claim_id = self.make_claim_id(slug, company["claim_type"])

            organizations.append({
                "id": org_id,
                "slug": slug,
                "name": name,
                "description": company["commitment_text"][:300],
                "website": company.get("website"),
                "org_type": "company",
                "country": None,
                "source_ids": [self.SOURCE_ID],
                "verified": False,
                "claimed": False,
                "tags": ["profit-for-good"],
                "added": today,
                "updated": today,
            })

            offerings.append({
                "id": off_id,
                "slug": f"{slug}-pfg",
                "name": f"{name} — Profit for Good",
                "org_id": org_id,
                "offering_type": "company",
                "exactness": "inferred",
                "category": "Profit for Good company",
                "description": company["commitment_text"][:300],
                "tags": ["profit-for-good"],
                "added": today,
                "updated": today,
            })

            parsed_value: dict = {}
            if company.get("giving_pct") is not None:
                parsed_value = {"percentage": company["giving_pct"], "basis": "profits"}

            claims.append({
                "id": claim_id,
                "offering_id": off_id,
                "org_id": org_id,
                "claim_type": company["claim_type"],
                "claim_text": company["commitment_text"],
                "parsed_value": parsed_value,
                "confidence": 0.85,
                "risk_level": company["risk_level"],
                "source_id": self.SOURCE_ID,
                "beneficiary": company["beneficiary"],
                "cause_area": company["cause_area"],
                "impact_scope": "pfg",
                "status": "active",
                "valid_from": None,
                "valid_until": None,
                "added": today,
                "updated": today,
            })

        return {
            "organizations": organizations,
            "offerings": offerings,
            "claims": claims,
        }
