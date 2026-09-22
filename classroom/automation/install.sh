#!/usr/bin/env bash
# Idempotent installer for Homelab Academy classroom automation.
# Does NOT enable timers unless --activate is passed (still requires operator approval for first enable).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SITE_REPO="${CLASSROOM_SITE_REPO:-/root/otaconskeep-site}"
ENV_DST="/etc/otaconskeep-classroom.env"
STATE="/var/lib/otaconskeep-classroom"
LOG="/var/log/otaconskeep-classroom"
ACTIVATE=0

for arg in "$@"; do
  case "$arg" in
    --activate) ACTIVATE=1 ;;
    --help|-h)
      echo "Usage: $0 [--activate]"
      echo "  Default: install units DISABLED, run tests + dry-run helpers."
      echo "  --activate: enable timers (only after dry-run evidence approved)."
      exit 0
      ;;
  esac
done

echo "== prerequisites =="
command -v python3 >/dev/null
command -v systemctl >/dev/null
[[ -d "$SITE_REPO/classroom/pack" ]] || { echo "missing site classroom pack: $SITE_REPO"; exit 1; }
[[ -d "$ROOT" ]] || exit 1

echo "== runtime dirs =="
install -d -m 0755 "$STATE/state" "$STATE/staging" "$STATE/artifacts" "$LOG"
touch "$STATE/classroom.publish.lock"
chmod 0644 "$STATE/classroom.publish.lock"

echo "== env file =="
if [[ ! -f "$ENV_DST" ]]; then
  cp "$ROOT/config.example.env" "$ENV_DST"
  # seed OmniRoute key from process env if present (do not echo)
  if [[ -n "${OMNIROUTE_API_KEY:-}" ]]; then
    sed -i "s|^OMNIROUTE_API_KEY=.*|OMNIROUTE_API_KEY=${OMNIROUTE_API_KEY}|" "$ENV_DST"
  fi
  chmod 0640 "$ENV_DST"
  echo "Wrote $ENV_DST (mode 0640). Review WRITER_MODEL before activation."
else
  echo "Keeping existing $ENV_DST"
fi

echo "== python deps =="
python3 -m pip install --user -q -r "$ROOT/requirements.txt"

echo "== systemd units (installed, not enabled unless --activate) =="
for f in "$ROOT"/systemd/*.service "$ROOT"/systemd/*.timer; do
  [[ -e "$f" ]] || continue
  install -m 0644 "$f" "/etc/systemd/system/$(basename "$f")"
done
systemctl daemon-reload

echo "== unit tests =="
python3 -m pytest "$ROOT/tests" -q || python3 "$ROOT/tests/run_tests.py"

echo "== dry-run helper (does not publish) =="
echo "Run: GENERATOR_BACKEND=curated DRY_RUN=1 python3 $ROOT/run_dry_batch.py"

if [[ "$ACTIVATE" -eq 1 ]]; then
  echo "ERROR: refusing --activate during initial rollout script without explicit APPROVED file."
  echo "Create $STATE/state/ACTIVATION_APPROVED with the dry-run evidence id, then re-run with --activate."
  if [[ -f "$STATE/state/ACTIVATION_APPROVED" ]]; then
    systemctl enable --now otaconskeep-classroom-core-am.timer
    systemctl enable --now otaconskeep-classroom-core-late.timer
    systemctl enable --now otaconskeep-classroom-news.timer
    systemctl list-timers 'otaconskeep-classroom*'
  else
    exit 2
  fi
else
  echo "Timers installed but DISABLED."
  systemctl list-timers --all 'otaconskeep-classroom*' || true
fi

echo "OK — install complete (fail-closed; no publish)."
