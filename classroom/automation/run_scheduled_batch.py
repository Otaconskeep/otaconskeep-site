#!/usr/bin/env python3
"""Scheduled entrypoint — no-ops when core complete; never publishes while DRY_RUN=1."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from lib import load_config, JsonLogger, new_run_id, publication_lock
from lib.curriculum import next_core_batch, reconcile_manifest


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--slot", choices=["am", "late"], required=True)
    args = ap.parse_args()
    cfg = load_config()
    run_id = new_run_id(f"sched_{args.slot}")
    logger = JsonLogger(cfg.log_dir / f"{run_id}.jsonl", run_id, f"core_{args.slot}")
    try:
        with publication_lock(cfg, logger):
            man = reconcile_manifest(cfg)
            if man.get("core_complete"):
                logger.event("complete", disposition="core_complete_noop")
                return 0
            pending = next_core_batch(cfg)
            if not pending:
                logger.event("complete", disposition="core_complete_noop")
                return 0
            if cfg.dry_run:
                logger.event(
                    "blocked",
                    disposition="dry_run_blocks_schedule",
                    message="DRY_RUN=1 — scheduled publish disabled. Run run_dry_batch.py and seek approval.",
                )
                return 0
            # Production path would call generate→review→publish with git; left gated.
            logger.event(
                "blocked",
                disposition="activation_required",
                message="Set DRY_RUN=0 and ACTIVATION_APPROVED before scheduled publish is permitted.",
            )
            return 0
    finally:
        logger.close()


if __name__ == "__main__":
    raise SystemExit(main())
