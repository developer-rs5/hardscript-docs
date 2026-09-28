#!/usr/bin/env bash
#
# Make a HardScript compiler available, and print its path.
#
# The documentation build compiles every HardScript snippet on the site. That
# is the whole point of the guarantee on the landing page, and it cannot be kept
# by a CI host that has no compiler: the validator exits non-zero rather than
# reporting success on snippets it never ran, so a deploy without this step fails
# loudly instead of shipping something unverified.
#
# Resolution order, cheapest first:
#
#   1. $HARD_BIN, if it points at something executable
#   2. a sibling checkout of the compiler repository
#   3. $HARD_HOME_SRC, if it is a checkout that needs building
#   4. a fresh shallow clone, which is the CI path
#
# Override the source with HARD_REPO, and the revision with HARD_REF. The
# default is the v0.9-alpha tag, which is the version this site documents: a
# build that validates snippets against a moving branch is a build whose claims
# change without a deploy. The compiler's default branch is `master`, not
# `main`, which is the sort of default that fails silently in a CI log.
#
# Usage:  HARD_BIN=$(bash scripts/ci/ensure-compiler.sh) npm run build

set -euo pipefail

REPO="${HARD_REPO:-https://github.com/developer-rs5/hardscript-1.git}"
# The version this site documents. Bump both together, deliberately.
REF="${HARD_REF:-v0.9-alpha}"
BIN_NAME="hard"
SRC="${HARD_HOME_SRC:-$PWD/.hardscript-compiler}"

log() { printf 'ensure-compiler: %s\n' "$1" >&2; }

usable() {
  [ -n "${1:-}" ] && [ -x "$1" ] && [ -s "$1" ]
}

# 1. An explicit path wins, and a wrong one is an error rather than a fallback:
# silently ignoring $HARD_BIN would mean a misconfigured CI host built a
# different compiler than the one the operator asked for.
if [ -n "${HARD_BIN:-}" ]; then
  if usable "$HARD_BIN"; then
    log "using \$HARD_BIN ($HARD_BIN)"
    printf '%s\n' "$HARD_BIN"
    exit 0
  fi
  log "FATAL: \$HARD_BIN is set to '$HARD_BIN' and is not an executable file"
  exit 1
fi

# 2. A sibling checkout, which is how a developer works: both repos on disk.
for candidate in "$PWD/../hardscript" "$PWD/../hardscript-1" "$PWD/../hard-script"; do
  for profile in release debug; do
    if usable "$candidate/target/$profile/$BIN_NAME"; then
      log "using the sibling build at $candidate/target/$profile/$BIN_NAME"
      printf '%s\n' "$candidate/target/$profile/$BIN_NAME"
      exit 0
    fi
  done
done

# 3 and 4. A checkout that may need building, or a fresh shallow clone.
if [ ! -d "$SRC/.git" ]; then
  log "cloning $REF from $REPO into $SRC (this is the slow path: a full release build follows)"
  rm -rf "$SRC"
  # `--branch` takes a tag as readily as a branch, and cloning the tag by name
  # is what keeps this reproducible.
  git clone --depth 1 --branch "$REF" "$REPO" "$SRC"
else
  log "reusing the checkout at $SRC"
fi

# `--bin hard` rather than `cargo install`: install copies the binary somewhere
# on PATH and then this script has to find it again, and a build keeps the
# artefact exactly where we pointed HARD_BIN.
log "building the compiler (this takes a few minutes on a cold cache)"
( cd "$SRC" && cargo build --release --bin "$BIN_NAME" )

BIN="$SRC/target/release/$BIN_NAME"
if ! usable "$BIN"; then
  log "FATAL: the build finished but $BIN is not there"
  exit 1
fi

log "built $("$BIN" --version 2>/dev/null | head -1 || echo unknown)"
printf '%s\n' "$BIN"
