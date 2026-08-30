#!/bin/bash
# ─── OPGA 81 — Welcome presentation ──────────────────────────────────────────
# Double-click this file. It serves the folder locally and opens it fullscreen
# in Chrome. Nothing here touches the network — safe to run with wifi off.

cd "$(dirname "$0")" || exit 1
PORT=8113
# ?room=1 tells the page it may start sound on its own — this launch
# passes --autoplay-policy below, so no start card is needed.
URL="http://127.0.0.1:$PORT/index.html?room=1"

cleanup() {
  [ -n "$CHROME_PID" ] && kill "$CHROME_PID" 2>/dev/null
  [ -n "$SRV" ] && kill "$SRV" 2>/dev/null
  return 0
}
trap cleanup EXIT INT TERM

# Reuse an already-running server on this port, otherwise start one.
if ! curl -s -o /dev/null --max-time 1 "$URL"; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
  SRV=$!
  for _ in $(seq 1 40); do
    curl -s -o /dev/null --max-time 1 "$URL" && break
    sleep 0.25
  done
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ -x "$CHROME" ]; then
  # Launch the binary directly, not via `open`. With Chrome already running,
  # `open -na ... --args` is silently ignored and you get an ordinary tab.
  #
  # The separate profile directory guarantees a fresh instance that honours
  # the flags, and gives a clean window on the room screen — no extensions,
  # no bookmarks bar, no personal tabs, and no notifications popping up
  # mid-presentation.
  #
  # --autoplay-policy is what lets the narration start on its own. Without it
  # Chrome waits for a click and the opening line is missed.
  "$CHROME" \
    --app="$URL" \
    --start-fullscreen \
    --user-data-dir="$HOME/Library/Application Support/OPGA81-Present" \
    --no-first-run \
    --no-default-browser-check \
    --disable-session-crashed-bubble \
    --disable-features=Translate,InfobarScreenshot \
    --autoplay-policy=no-user-gesture-required \
    --force-device-scale-factor=1 \
    >/dev/null 2>&1 &
  CHROME_PID=$!
else
  echo "Google Chrome not found — opening in your default browser."
  echo "Press F for fullscreen once it loads."
  open "$URL"
fi

echo ""
echo "  OPGA 81 — Welcome  ·  serving on $URL"
echo ""
echo "  Space  pause / resume        F  fullscreen"
echo "  ← →    previous / next       R  restart"
echo "  1–0    jump to scene         M  mute the narration"
echo "                               D  debug overlay"
echo ""
echo "  Closing this Terminal window also closes the presentation."
echo ""
wait
