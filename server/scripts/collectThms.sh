#!/usr/bin/env bash                                                                                                                         

set -euo pipefail # realpath or dirname failure should abort                                                                                

PROJECT_DIR="$(realpath "$1")" # Read-only project source
shift
WORK_DIR="$(realpath "$1")"    # Task-specific temporary directory
shift

GIT_PATH=$(dirname $(realpath $(which git)))
DIRNAME_PATH=$(dirname $(realpath $(which dirname)))

cd $PROJECT_DIR
LEAN_ROOT="$(lean --print-prefix)"

SH=$(realpath $(which sh))
SCRIPT=$(cat <<EOF
ulimit -t 60       # 60 seconds
ulimit -v 16777216 # 16gb (includes mmaped things)
ulimit -u 128      # 128 subprocesses spawnable
ulimit -f 524288   # File output size limits
exec /lean/bin/lake exe challenge-thms
EOF
)

mkdir -p $WORK_DIR/ChallengeThms
mkdir -p $WORK_DIR/ChallengeThms-staging
exec bwrap \
     --ro-bind /nix /nix \
     --ro-bind "$LEAN_ROOT" /lean \
     \
     --dev /dev \
     --tmpfs /tmp \
     --proc /proc \
     \
     --clearenv \
     --setenv PATH "$GIT_PATH:$DIRNAME_PATH" \
     --setenv HOME "/tmp" \
     \
     --ro-bind "$PROJECT_DIR" /project \
     --ro-bind "$WORK_DIR/Challenge/Challenge.lean" /project/Challenge.lean \
     --overlay-src "$PROJECT_DIR/.lake/build" \
     --overlay-src "$WORK_DIR/Challenge/.lake/build" \
     --overlay "$WORK_DIR/ChallengeThms" "$WORK_DIR/ChallengeThms-staging" /project/.lake/build \
     \
     --unshare-all \
     --new-session \
     --die-with-parent \
     --hostname sandbox \
     --uid 65534 \
     --gid 65534 \
     --cap-drop ALL \
     --chdir /project \
     \
     "$SH" -c "$SCRIPT"
