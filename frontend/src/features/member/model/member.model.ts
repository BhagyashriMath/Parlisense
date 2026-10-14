/**
 * Member Domain Model & Audio Synthesizer Logic
 */

const lastSpokenMap: Record<string, number> = {};

export function playAlertChime(severity: "info" | "warning" | "critical" = "warning") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    const freq = severity === "critical" ? 880 : severity === "warning" ? 659.25 : 523.25;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
}

export function speakMessage(
  text: string,
  category: string = "general",
  cooldownMs: number = 2500
) {
  if (!text || typeof window === "undefined") return;
  const now = Date.now();
  const key = `${category}_${text.slice(0, 30)}`;
  if (lastSpokenMap[key] && now - lastSpokenMap[key] < cooldownMs) {
    return;
  }
  lastSpokenMap[key] = now;

  // Always play alert chime sound so warnings and alerts are immediately audible
  playAlertChime(category.includes("critical") || category.includes("emergency") ? "critical" : "warning");

  if (!("speechSynthesis" in window)) return;

  try {
    // Avoid Chrome bug where synchronous cancel() drops subsequent utterance
    window.speechSynthesis.cancel();
    setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const utt = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(
          (v) => v.lang.includes("IN") || v.lang.includes("GB") || v.lang.includes("US")
        ) || voices[0];
        if (preferred) {
          utt.voice = preferred;
          utt.lang = preferred.lang;
        } else {
          utt.lang = "en-US";
        }
        utt.rate = 0.95;
        utt.volume = 1;
        window.speechSynthesis.speak(utt);
      } catch (err) {
        console.warn("Speech synthesis error:", err);
      }
    }, 60);
  } catch (err) {
    console.warn("Speech synthesis cancel notice:", err);
  }
}

export function calculateMemberTimeMetrics(
  usedSeconds: number,
  allocatedSeconds: number = 300
): {
  remainingSeconds: number;
  isQuotaExhausted: boolean;
  timePercent: number;
  isWarningZone: boolean;
} {
  const remainingSeconds = Math.max(0, allocatedSeconds - usedSeconds);
  const isQuotaExhausted = remainingSeconds === 0;
  const timePercent = allocatedSeconds > 0 ? Math.min(100, Math.max(0, (usedSeconds / allocatedSeconds) * 100)) : 100;
  const isWarningZone =
    remainingSeconds > 0 && remainingSeconds <= allocatedSeconds * 0.15;

  return {
    remainingSeconds,
    isQuotaExhausted,
    timePercent,
    isWarningZone
  };
}
