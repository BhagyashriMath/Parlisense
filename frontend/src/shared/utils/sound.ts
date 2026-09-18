/**
 * Synthesizes a subtle acoustic chime for chamber alerts when audio is unmuted.
 */
export function playChamberAlertChime(severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === "CRITICAL" ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(severity === "CRITICAL" ? 660 : 440, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {
    // Suppress browser autoplay / audio policy errors
  }
}
