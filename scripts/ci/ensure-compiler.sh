#!/usr/bin/env bash
#
# Make a HardScript compiler available, and print its path.
#
# The documentation build compiles every HardScript snippet on the site. That is
# the whole point of the guarantee on the landing page, and it cannot be kept by
# a host that has no compiler: the validator exits non-zero rather than reporting
# success on snippets it never ran, so a build without this step fails loudly
# instead of shipping something unverified.
#
# Resolution order, cheapest first:
#
#   1. $HARD_BIN, if it points at something executable
#   2. a sibling checkout of the compiler repository
#   3. $HARD_HOME_SRC, if it is a checkout that needs building
#   4. a fresh shallow clone, which is the CI path
#
# Private repositories
# --------------------
# The compiler repository is private, so a CI host needs a token to clone it.
# Set GITHUB_TOKEN (or GH_TOKEN) in the build environment and the clone uses it.
# The token is only ever passed in a URL to git, never printed, and never
# written to the repository.
#
# Revision
# --------
# Override the source with HARD_REPO and the revision with HARD_REF. The default
# is the v0.9-alpha tag, which is the version this site documents: a build that
# validates snippets against a moving branch is a build whose claims change
# without a deploy. The compiler's default branch is `master`, not `main`, which
# is the sort of default that fails silently in a CI log.
#
# Build time
# ----------
# The release build is minutes, not seconds, on a cold cache. CARGO_TARGET_DIR
# defaults to a directory under the CI cache root so that a host which persists
# its caches between builds pays the cost once rather than every deploy.
#
# Usage:  HARD_BIN=$(bash scripts/ci/ensure-compiler.sh) npm run build

set -euo pipefail

REPO="${HARD_REPO:-https://github.com/developer-rs5/hardscript-1.git}"
# The version this site documents. Bump both together, deliberately.
REF="${HARD_REF:-v0.9-alpha}"
BIN_NAME="hard"
SRC="${HARD_HOME_SRC:-$PWD/.hardscript-compiler}"

# Caching, on a CI host
# ---------------------
# The repository directory is discarded between deploys, so anything that makes
# the compiler build expensive has to live outside it or it is paid again every
# time: the crate downloads, the toolchain, and the compiled output. /root/.cache
# is the directory CI images persist, so those three go there.
#
# Only on a host that looks like one, and only when the variables are unset, so
# a developer machine with a warm ~/.cargo is left alone.
if [ -d /root/.cache ] && [ -z "${CI:-}" ]; then
  :
elif [ -d /root/.cache ]; then
  export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-/root/.cache/hardscript-target}"
  export CARGO_HOME="${CARGO_HOME:-/root/.cache/cargo-home}"
  export RUSTUP_HOME="${RUSTUP_HOME:-/root/.cache/rustup-home}"
  log "CI host: caching the Rust toolchain, crate downloads and build output under /root/.cache"
fi

log() { printf 'ensure-compiler: %s\n' "$1" >&2; }

usable() {
  [ -n "${1:-}" ] && [ -x "$1" ] && [ -s "$1" ]
}

# A Rust toolchain that can actually run
# -------------------------------------
# Most CI images ship rustup with no default toolchain selected, and cargo then
# refuses to do anything:
#
#   error: rustup could not choose a version of cargo to run, because one
#   wasn't specified explicitly, and no default is configured.
#
# Rather than guess which toolchain a host has, this asks cargo whether it works
# and, if it does not, installs a named one and pins it for the build with
# RUSTUP_TOOLCHAIN. Pinning matters twice over: cargo stops guessing, and the
# build does not depend on whatever `rustup default` happened to point at.
ensure_rust() {
  if cargo --version >/dev/null 2>&1; then
    return 0
  fi
  if ! command -v rustup >/dev/null 2>&1; then
    log "FATAL: cargo is not on PATH and rustup is not installed either."
    log "  Install Rust from https://rustup.rs, or set HARD_BIN to a prebuilt compiler."
    return 1
  fi
  local toolchain="${RUSTUP_TOOLCHAIN:-stable}"
  log "cargo cannot run yet (no default rustup toolchain); installing $toolchain"
  if ! rustup toolchain install "$toolchain" --profile minimal --no-self-update >/dev/null 2>&1; then
    log "FATAL: could not install the $toolchain toolchain."
    log "  Check network access to static.rust-lang.org, or set HARD_BIN to a"
    log "  prebuilt compiler."
    return 1
  fi
  export RUSTUP_TOOLCHAIN="$toolchain"
  if ! cargo --version >/dev/null 2>&1; then
    log "FATAL: cargo still cannot run after installing $toolchain"
    return 1
  fi
  log "using $(cargo --version 2>/dev/null | head -1)"
}

# Never let git stop for a username: on a build host there is no terminal, and
# the resulting error is a wall of "could not read Username" instead of the one
# line that says what to do.
export GIT_TERMINAL_PROMPT=0

# 1. An explicit path wins, and a wrong one is an error rather than a fallback:
# silently ignoring $HARD_BIN would mean a misconfigured host built a different
# compiler than the one an operator asked for.
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
#
# A token is only ever handed to git through the URL, and is kept out of the log:
# a build log is the last place a credential should be.
AUTH=""
if [ -n "${GITHUB_TOKEN:-${GH_TOKEN:-}}" ]; then
  AUTH="x-access-token:${GITHUB_TOKEN:-${GH_TOKEN}}@"
  log "authenticating to github.com with \$GITHUB_TOKEN"
else
  log "no \$GITHUB_TOKEN set; the clone will be anonymous"
fi

if [ ! -d "$SRC/.git" ]; then
  log "cloning $REF from $REPO into $SRC (slow path: a full release build follows)"
  rm -rf "$SRC"
  # `--branch` takes a tag as readily as a branch, and cloning the tag by name
  # is what keeps this reproducible.
  if ! git clone --depth 1 --branch "$REF" "https://$AUTH${REPO#https://}" "$SRC"; then
    log ""
    log "FATAL: could not clone the compiler repository."
    if [ -z "$AUTH" ]; then
      log "  The repository is private, so an anonymous clone cannot work."
      log "  Set GITHUB_TOKEN in the build environment to a token that can read"
      log "  $REPO — a fine-grained token with read-only Contents access is enough."
    else
      log "  The token was rejected. Check that it is current and has read access"
      log "  to $REPO."
    fi
    log "  Or set HARD_BIN to a compiler you have already built."
    exit 1
  fi
else
  log "reusing the checkout at $SRC"
fi

# `--bin hard` rather than `cargo install`: install copies the binary somewhere
# on PATH and then this script has to find it again, and a build keeps the
# artefact exactly where we pointed HARD_BIN.
ensure_rust || exit 1

log "building the compiler (minutes on a cold cache, seconds once the target dir is warm)"
if ! ( cd "$SRC" && cargo build --release --bin "$BIN_NAME" ); then
  log "FATAL: the compiler build failed after a working toolchain was confirmed."
  log "  The full cargo output is above; the first error in it is the real one."
  log "  Or set HARD_BIN to a compiler you have already built."
  exit 1
fi

BIN="$SRC/target/release/$BIN_NAME"
if ! usable "$BIN"; then
  log "FATAL: the build finished but $BIN is not there"
  exit 1
fi

log "built $("$BIN" --version 2>/dev/null | head -1 || echo unknown)"
printf '%s\n' "$BIN"
