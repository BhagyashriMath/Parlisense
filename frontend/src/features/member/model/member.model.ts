/**
 * Member Domain Model & Audio Synthesizer Logic
 */

const lastSpokenMap: Record<string, number> = {};

export function speakMessage(
  text: string,
  category: string = "general",
  cooldownMs: number = 8000
) {
  if (!text || !("speechSynthesis" in window)) return;
  const now = Date.now();
  if (lastSpokenMap[category] && now - lastSpokenMap[category] < cooldownMs) {
    return;
  }
  lastSpokenMap[category] = now;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-IN";
  utt.rate = 0.92;
  utt.volume = 1;
  window.speechSynthesis.speak(utt);
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
