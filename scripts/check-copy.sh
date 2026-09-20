#!/usr/bin/env bash
# Handoff §14 — copy rules are legal constraints, so they are checked, not trusted.
#
# src/dashboard/copyRules.ts is excluded because it is the canonical list: it
# names the banned phrases in order to forbid them, and is rendered on the
# Help page. Every other hit in src/ is a real defect.
#
# The word boundaries matter. "$preview" contains "review" and "aria-pressed"
# contains "press", so a looser pattern fires on correct code.
set -uo pipefail

PATTERN='backlit|backlight|per-key[ -]?rgb|cherry[ -]?mx|made in new zealand|as seen in'

if grep -rniE "$PATTERN" src/ --exclude=copyRules.ts; then
  echo
  echo "FAIL: banned phrase above. See src/dashboard/copyRules.ts for the replacement."
  exit 1
fi

echo "PASS: no banned phrases in src/"
