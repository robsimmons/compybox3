#!/usr/bin/env bash                                                                                                                         

set -euo pipefail # realpath or dirname failure should abort                                                                                

PROJECT_DIR="$(realpath "$1")" # Read-only project source
shift
WORK_DIR="$(realpath "$1")"    # Task-specific temporary directory
shift
MODULE_NAME="$1"               # The argument to `lake exe module-constants`
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
exec /lean/bin/lake build "$MODULE_NAME"                                                                                                    
EOF
)

mkdir -p "$PROJECT_DIR/.lake/build"
mkdir -p "$WORK_DIR/$MODULE_NAME/.lake/build"
mkdir -p "$WORK_DIR/$MODULE_NAME-staging"
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
     --ro-bind "$WORK_DIR/$MODULE_NAME/$MODULE_NAME.lean" "/project/$MODULE_NAME.lean" \
     --overlay-src "$PROJECT_DIR/.lake/build" \
     --overlay "$WORK_DIR/$MODULE_NAME/.lake/build" "$WORK_DIR/$MODULE_NAME-staging" /project/.lake/build \
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
