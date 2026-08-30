// ═══════════════════════════════════════════════════════════════════════════
//  The spoken track.
//
//  One pre-rendered file, rendered from data/narration.js by
//  `node tools/narrate.mjs`. Nothing is synthesised at run time and nothing
//  here touches the network — the room stays offline.
//
//  Sync is deliberately dumb, and that is why it survives the room. The audio
//  is not driven by events; every frame it is compared with the master
//  timeline's own clock and corrected if it has drifted. Pause, ← →, a jump
//  to scene 6, R to restart — none of them need to know this file exists.
// ═══════════════════════════════════════════════════════════════════════════

/** Resync if the voice and the picture are more than this far apart. */
const DRIFT = 0.25;

/**
 * Attach the narration to a running presentation.
 *
 * @param {object} app    the app object from main.js — needs `app.tl`
 * @param {number} total  the timeline's full duration, in seconds
 * @returns {{ update(): void, toggleMute(): boolean, ready: Promise,
 *             audio: HTMLAudioElement, isMuted(): boolean }}
 */
export function attachNarration(app, total) {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.volume = 0.95;

  // Load the whole track into memory before using it.
  //
  // Seeking a progressively-streamed file requires the server to answer HTTP
  // Range requests, and `python3 -m http.server` — which is what
  // present.command runs — does not implement them. Without this, the very
  // first pause, scene jump or restart would set currentTime and be silently
  // ignored, sending the voice back to zero while the picture carried on.
  // A blob URL is seekable no matter what is serving the folder.
  const source = fetch('assets/narration.m4a')
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((b) => { audio.src = URL.createObjectURL(b); })
    .catch((e) => {
      console.warn('narration: falling back to streaming —', e.message);
      audio.src = 'assets/narration.m4a';
    });

  // Chrome will refuse to start audio without a gesture unless the browser was
  // launched with --autoplay-policy=no-user-gesture-required, which
  // present.command does. Anywhere else, the first key or click starts it and
  // a quiet hint says so.
  let blocked = false;
  const hint = document.createElement('div');
  hint.id = 'audiohint';
  hint.textContent = 'Press any key for sound';
  hint.hidden = true;
  document.body.appendChild(hint);

  const unblock = () => {
    if (!blocked) return;
    blocked = false;
    hint.hidden = true;
    audio.currentTime = app.tl.time();
    audio.play().catch(() => {});
  };
  addEventListener('keydown', unblock, { passive: true });
  addEventListener('pointerdown', unblock, { passive: true });

  const start = () => audio.play().catch(() => { blocked = true; hint.hidden = false; });

  let muted = false;

  /**
   * Ask the browser, before anything starts, whether it will let sound play
   * on its own. present.command launches Chrome with the flag that permits it;
   * a hosted copy on GitHub Pages has no such option and will refuse until
   * someone clicks. Knowing which we are in lets the caller put up a start
   * gate rather than run five silent minutes.
   */
  const canAutoplay = async () => {
    const wasVolume = audio.volume;
    audio.volume = 0;
    try {
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      return true;
    } catch {
      return false;
    } finally {
      audio.volume = wasVolume;
    }
  };

  return {
    /** The element itself, so a test can watch the voice as the room hears it. */
    audio,

    /** Whether the voice is currently silenced. */
    isMuted: () => muted,

    /** True if sound may start unprompted; false if a gesture is required. */
    canAutoplay,

    /**
     * Start the voice from inside a real user gesture. Must be called
     * synchronously from the click or key handler, or the browser refuses.
     */
    startFromGesture() {
      blocked = false;
      hint.hidden = true;
      audio.currentTime = app.tl.time();
      return audio.play().catch(() => {});
    },

    /**
     * Called once per frame from the render loop. The timeline is the clock;
     * the voice follows it.
     */
    update() {
      const t = app.tl.time();

      // Pause and mute are obeyed at every moment, including while the last
      // line is still landing over the held final card. Anything else means
      // pressing Space at the very end leaves a voice talking to a still room.
      if (app.tl.paused() || muted) {
        if (!audio.paused) audio.pause();
        return;
      }

      // Past the end of the timeline the picture holds and the voice finishes
      // by itself. Stop correcting — there is no longer a clock to follow —
      // but do pick it up again if it was paused and has more to say.
      if (t >= total - 0.1) {
        if (audio.paused && audio.currentTime < audio.duration - 0.25) start();
        return;
      }
      if (audio.paused) {
        audio.currentTime = t;
        start();
        return;
      }
      // A seek is asynchronous; without this guard we would re-issue it every
      // frame until it landed, which stutters the voice.
      if (!audio.seeking && Math.abs(audio.currentTime - t) > DRIFT) {
        audio.currentTime = t;
      }
    },

    /** M in the room, if the voice is not wanted on a particular run. */
    toggleMute() {
      muted = !muted;
      if (muted) audio.pause();
      return muted;
    },

    /** Resolves when the track is loaded and seekable, or gives up trying. */
    ready: source.then(() => new Promise((res) => {
      if (audio.readyState >= 3) return res();
      audio.addEventListener('canplaythrough', res, { once: true });
      // Never let a missing or slow file hold up the presentation.
      audio.addEventListener('error', res, { once: true });
      setTimeout(res, 6000);
    })),
  };
}
