"""
base_importer.py — abstract base class for source-specific importers.

Each importer is responsible for:
  1. Fetching/parsing a source (directory, webpage, API)
  2. Mapping source data to the canonical schema
  3. Writing JSON files to data/organizations/, data/offerings/, data/claims/

Usage pattern:
  class ProfitForGoodImporter(BaseImporter):
      SOURCE_ID = "src-profit-for-good"
      SOURCE_URL = "https://profitforgood.info"

      def fetch_raw(self):
          # scrape / download
          ...

      def transform(self, raw):
          # map to canonical schema
          ...
"""

import json
import os
from abc import ABC, abstractmethod
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class BaseImporter(ABC):
    SOURCE_ID: str = ""
    SOURCE_URL: str = ""

    def __init__(self):
        self.today = date.today().isoformat()

    @abstractmethod
    def fetch_raw(self):
        """Fetch raw data from the source. Returns any structure."""
        pass

    @abstractmethod
    def transform(self, raw) -> dict:
        """
        Transform raw data into canonical schema.

        Returns:
          {
            "organizations": [...],
            "offerings": [...],
            "claims": [...],
          }
        """
        pass

    def run(self, dry_run=False):
        raw = self.fetch_raw()
        result = self.transform(raw)

        if dry_run:
            print(json.dumps(result, indent=2))
            return

        self._write_json(result.get("organizations", []), "organizations", f"{self.SOURCE_ID}-orgs.json")
        self._write_json(result.get("offerings", []), "offerings", f"{self.SOURCE_ID}-offerings.json")
        self._write_json(result.get("claims", []), "claims", f"{self.SOURCE_ID}-claims.json")

        print(f"Imported {len(result.get('organizations', []))} orgs, "
              f"{len(result.get('offerings', []))} offerings, "
              f"{len(result.get('claims', []))} claims from {self.SOURCE_ID}")

    def _write_json(self, data, subdir, filename):
        path = os.path.join(ROOT, "data", subdir, filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  Written: {path}")

    def make_org_id(self, slug):
        return f"org-{slug}"

    def make_offering_id(self, slug):
        return f"off-{slug}"

    def make_claim_id(self, slug, claim_type):
        return f"clm-{slug}-{claim_type}"
