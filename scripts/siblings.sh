#!/usr/bin/env bash
# Print the CONCEPT.md of every sibling entry, from whichever branch has one,
# so this session picks a concept that doesn't overlap Rishik's other entries.
set -u
OWNER=rishikrrontala-bot
SELF=practicetocreate
REPOS=(practicetocreate acodemic-hackathon lexhack-2026 luma-hackathon-fall firstcommit next-byte-hacks-v4 305hackshellssep2026 gibc-v2 csc-back-to-school ml-build-challenge-3 univabio creatorcolosseumshowdown next-founders dsh-hacks-v2 innovart2027)
for r in "${REPOS[@]}"; do
  [ "$r" = "$SELF" ] && continue
  found=""
  for b in main $(git ls-remote --heads "https://github.com/$OWNER/$r" 2>/dev/null | sed 's#.*refs/heads/##' | grep -v '^main$'); do
    body=$(curl -fsSL "https://raw.githubusercontent.com/$OWNER/$r/$b/CONCEPT.md" 2>/dev/null) || continue
    printf '\n━━━ %s (branch %s) ━━━\n%s\n' "$r" "$b" "$(printf '%s' "$body" | head -25)"
    found=1; break
  done
  [ -z "$found" ] && printf '\n━━━ %s ━━━\n(no concept claimed yet)\n' "$r"
done
