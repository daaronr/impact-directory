"""
run_importers.py — run all source importers, then consolidate.

Usage:
  python scripts/run_importers.py           # run all importers + consolidate
  python scripts/run_importers.py --dry-run  # print output only, no files written
  python scripts/run_importers.py gwwc       # run only the GWWC importer
  python scripts/run_importers.py pfg        # run only the Profit for Good importer
  python scripts/run_importers.py fp         # run only the Founders Pledge importer
  python scripts/run_importers.py pfga       # run only the PFG Alliance importer
  python scripts/run_importers.py gs          # run only the Good Store importer
  python scripts/run_importers.py pledge1pct  # run only the Pledge 1% importer

importers are skipped (not failed) if the source site is unreachable.
"""

import argparse
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from scripts.importers.gwwc import GWWCImporter
from scripts.importers.profit_for_good import ProfitForGoodImporter
from scripts.importers.ea_services import EAServicesImporter
from scripts.importers.founders_pledge import FoundersPledgeImporter
from scripts.importers.pfg_alliance import PFGAllianceImporter
from scripts.importers.good_store import GoodStoreImporter
from scripts.importers.one_pct_planet import OnePctPlanetImporter
from scripts.importers.pledge_1pct import Pledge1PctImporter

IMPORTERS = {
    "gwwc": GWWCImporter,
    "pfg": ProfitForGoodImporter,
    "ease": EAServicesImporter,
    "fp": FoundersPledgeImporter,
    "pfga": PFGAllianceImporter,
    "gs": GoodStoreImporter,
    "1pct": OnePctPlanetImporter,
    "pledge1pct": Pledge1PctImporter,
}


def run_importer(name: str, cls, dry_run: bool) -> bool:
    """Run a single importer. Returns True on success, False on skip/error."""
    print(f"\n{'='*60}")
    print(f"Importer: {name}")
    print("="*60)
    importer = cls()
    try:
        importer.run(dry_run=dry_run)
        return True
    except RuntimeError as e:
        print(f"  SKIPPED — {e}")
        return False
    except Exception as e:
        print(f"  ERROR — {type(e).__name__}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Run impact-directory source importers")
    parser.add_argument(
        "importers",
        nargs="*",
        choices=[*IMPORTERS.keys(), "all"],
        default=[],
        help="Which importers to run (default: all)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print output, no file writes")
    args = parser.parse_args()

    targets = args.importers if args.importers else list(IMPORTERS.keys())

    results = {}
    for name in targets:
        results[name] = run_importer(name, IMPORTERS[name], args.dry_run)

    print(f"\n{'='*60}")
    print("Summary:")
    for name, ok in results.items():
        print(f"  {name}: {'OK' if ok else 'skipped/errored'}")

    if not args.dry_run:
        # Run consolidate to regenerate all_data.json
        print("\nRunning consolidate.py ...")
        import scripts.consolidate as consolidate
        consolidate.main()
        print("Done.")


if __name__ == "__main__":
    main()
