#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GIF_DIR="${1:-$ROOT_DIR/demo/gifs}"
COLORS="${GIF_COLORS:-128}"

for command_name in ffmpeg ffprobe; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'error: %s is required\n' "$command_name" >&2
    exit 1
  fi
done

if [[ ! -d "$GIF_DIR" ]]; then
  printf 'error: GIF directory does not exist: %s\n' "$GIF_DIR" >&2
  exit 1
fi

if ! [[ "$COLORS" =~ ^[0-9]+$ ]] || (( COLORS < 2 || COLORS > 256 )); then
  printf 'error: GIF_COLORS must be an integer from 2 to 256\n' >&2
  exit 1
fi

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/awesome-interaction-gifs.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT

shopt -s nullglob
gifs=("$GIF_DIR"/*.gif)

if (( ${#gifs[@]} == 0 )); then
  printf 'error: no GIF files found in %s\n' "$GIF_DIR" >&2
  exit 1
fi

probe_stream() {
  ffprobe -v error \
    -select_streams v:0 \
    -show_entries stream=width,height,avg_frame_rate,duration,nb_frames \
    -of csv=p=0 \
    "$1"
}

bytes() {
  wc -c < "$1" | tr -d '[:space:]'
}

before_total=0
after_total=0

printf '%-32s %12s %12s %10s\n' 'GIF' 'before' 'after' 'saved'

for source in "${gifs[@]}"; do
  name="$(basename "$source")"
  candidate="$work_dir/$name"
  before_size="$(bytes "$source")"
  before_probe="$(probe_stream "$source")"

  ffmpeg -nostdin -hide_banner -loglevel error \
    -i "$source" \
    -filter_complex \
      "[0:v]split[a][b];[a]palettegen=max_colors=${COLORS}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
    -loop 0 \
    -gifflags +transdiff \
    "$candidate"

  after_probe="$(probe_stream "$candidate")"
  if [[ "$before_probe" != "$after_probe" ]]; then
    printf 'error: stream metadata changed for %s\n  before: %s\n  after:  %s\n' \
      "$name" "$before_probe" "$after_probe" >&2
    exit 1
  fi

  candidate_size="$(bytes "$candidate")"
  if (( candidate_size < before_size )); then
    mv "$candidate" "$source"
    after_size="$candidate_size"
  else
    after_size="$before_size"
  fi

  saved=$((before_size - after_size))
  before_total=$((before_total + before_size))
  after_total=$((after_total + after_size))
  printf '%-32s %12d %12d %9.1f%%\n' \
    "$name" "$before_size" "$after_size" \
    "$(awk -v before="$before_size" -v saved="$saved" 'BEGIN { print saved * 100 / before }')"
done

total_saved=$((before_total - after_total))
printf '\n%-32s %12d %12d %9.1f%%\n' \
  'TOTAL' "$before_total" "$after_total" \
  "$(awk -v before="$before_total" -v saved="$total_saved" 'BEGIN { print saved * 100 / before }')"
printf 'Dimensions, frame rate, duration, and frame count were preserved.\n'
printf 'Note: palette reduction is perceptual; always run this script from original GIF sources.\n'
