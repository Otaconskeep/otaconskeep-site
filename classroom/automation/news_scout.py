#!/usr/bin/env python3
"""Breakthrough news evaluator — fail closed; bonus lessons only."""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import JsonLogger, load_config, new_run_id, publication_lock, utc_now

# Conservative allowlist of primary sources (fetched only if network allowed)
PRIMARY_FEEDS = [
    "https://www.freedesktop.org/blog/",
    "https://www.docker.com/blog/",
    "https://ollama.com/blog",
]


def load_rejects(cfg) -> set[str]:
    path = cfg.news_reject_path
    seen: set[str] = set()
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            try:
                seen.add(json.loads(line).get("fingerprint", ""))
            except Exception:
                continue
    return seen


def append_reject(cfg, fingerprint: str, reason: str, title: str) -> None:
    cfg.news_reject_path.parent.mkdir(parents=True, exist_ok=True)
    with cfg.news_reject_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"ts": utc_now(), "fingerprint": fingerprint, "reason": reason, "title": title}) + "\n")


def evaluate_candidates(cfg, logger: JsonLogger) -> dict:
    """Without inventing news: if no verified primary candidate, return no lesson."""
    # Network fetch is best-effort; any uncertainty => no bonus
    rejects = load_rejects(cfg)
    candidates = []
    for url in PRIMARY_FEEDS:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "otaconskeep-classroom-news/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                body = resp.read(8000).decode("utf-8", errors="replace")
            fp = f"feed:{url}:{hash(body) & 0xffffffff}"
            if fp in rejects:
                continue
            # Do not auto-claim breakthroughs from HTML scraping alone — require human/LLM gate later.
            append_reject(cfg, fp, "insufficient_primary_verification_for_auto_bonus", url)
            candidates.append({"url": url, "status": "rejected", "reason": "insufficient_primary_verification_for_auto_bonus"})
        except Exception as e:
            candidates.append({"url": url, "status": "rejected", "reason": f"fetch_failed:{type(e).__name__}"})
    logger.event("news_eval", candidates=len(candidates), bonus=0)
    return {
        "ok": True,
        "bonus_lesson": None,
        "message": "No qualifying breakthrough.",
        "candidates": candidates,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", help="write report JSON")
    args = ap.parse_args()
    cfg = load_config()
    run_id = new_run_id("news")
    try:
        cfg.log_dir.mkdir(parents=True, exist_ok=True)
        cfg.state_dir.mkdir(parents=True, exist_ok=True)
    except PermissionError:
        base = Path("/tmp/otaconskeep-classroom-dryrun")
        cfg.log_dir = base / "logs"
        cfg.state_dir = base / "state"
        cfg.lock_file = base / "classroom.publish.lock"
        cfg.log_dir.mkdir(parents=True, exist_ok=True)
        cfg.state_dir.mkdir(parents=True, exist_ok=True)

    logger = JsonLogger(cfg.log_dir / f"{run_id}.jsonl", run_id, "news")
    try:
        with publication_lock(cfg, logger):
            if not cfg.news_enabled:
                report = {"message": "News disabled", "bonus_lesson": None}
            else:
                report = evaluate_candidates(cfg, logger)
            if args.out:
                Path(args.out).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
            print(json.dumps(report, indent=2))
            return 0
    except RuntimeError as e:
        if "lock busy" in str(e):
            print(json.dumps({"message": "lock busy", "bonus_lesson": None}))
            return 75
        raise
    finally:
        logger.close()


if __name__ == "__main__":
    raise SystemExit(main())
