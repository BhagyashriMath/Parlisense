/**
 * Chamber Audio & Speech Engine
 * Provides robust Web Audio API alert sound effects and multi-role Speech Synthesis (TTS).
 * Automatically unlocks audio on user gestures and ensures speech from members & speaker
 * is clearly audible to all participants in the chamber.
 */

// Global singletons
let sharedAudioCtx: AudioContext | null = null;
const activeUtterances = new Set<SpeechSynthesisUtterance>();
let cachedVoices: SpeechSynthesisVoice[] = [];
let audioUnlocked = false;
let globalIsMuted = false;

// Queue for floor speech to avoid overlapping or chopped utterances
interface FloorSpeechItem {
  id: string;
  text: string;
  isSpeakerRole: boolean;
  speakerName?: string;
}
const floorSpeechQueue: FloorSpeechItem[] = [];
let isProcessingQueue = false;

export function setChamberMuted(muted: boolean) {
  globalIsMuted = muted;
  if (muted && typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    floorSpeechQueue.length = 0;
    activeUtterances.clear();
  }
}

export function isChamberMuted(): boolean {
  return globalIsMuted;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function loadVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  cachedVoices = window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  }
}

export function initChamberAudio() {
  if (typeof window === "undefined" || audioUnlocked) return;
  loadVoices();

  const unlock = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
    window.removeEventListener("click", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("pointerdown", unlock);
  };

  window.addEventListener("click", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true, passive: true });
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
}

// Auto-init on load
if (typeof window !== "undefined") {
  initChamberAudio();
}

/**
 * Play an acoustic alert chime for chamber notifications and warnings.
 */
export function playChamberAlertChime(severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM") {
  if (globalIsMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const isCritical = severity === "CRITICAL";
    const isHigh = severity === "HIGH";

    osc.type = isCritical ? "sawtooth" : isHigh ? "triangle" : "sine";
    const freq = isCritical ? 720 : isHigh ? 580 : 440;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (isCritical || isHigh) {
      osc.frequency.setValueAtTime(freq * 1.25, ctx.currentTime + 0.12);
    }

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (_) {
    // Suppress browser autoplay errors
  }
}

/**
 * Find the most suitable voice for speech synthesis.
 */
function findBestVoice(): SpeechSynthesisVoice | null {
  if (cachedVoices.length === 0 && typeof window !== "undefined" && "speechSynthesis" in window) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  if (cachedVoices.length === 0) return null;

  // Try to find English (IN/UK/US) natural voices
  const inVoice = cachedVoices.find(v => v.lang.startsWith("en-IN") || v.lang.startsWith("en_IN"));
  if (inVoice) return inVoice;

  const naturalEn = cachedVoices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Online")));
  if (naturalEn) return naturalEn;

  const enVoice = cachedVoices.find(v => v.lang.startsWith("en"));
  return enVoice || cachedVoices[0] || null;
}

const recentSpokenAlerts = new Map<string, number>();

/**
 * Speak an urgent or standard warning/alert message.
 */
export function speakAlert(
  text: string,
  category = "alert",
  isUrgent = false
) {
  if (globalIsMuted || !text || typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const now = Date.now();
  const lastSpoken = recentSpokenAlerts.get(text) || 0;
  if (!isUrgent && now - lastSpoken < 4000) return;
  recentSpokenAlerts.set(text, now);

  try {
    window.speechSynthesis.resume();

    // If critical or urgent, clear current speech to announce immediately
    if (isUrgent) {
      window.speechSynthesis.cancel();
      activeUtterances.clear();
      floorSpeechQueue.length = 0;
    }

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-IN";
    utt.rate = 1.0;
    utt.pitch = 1.02;
    utt.volume = 1.0;

    const voice = findBestVoice();
    if (voice) utt.voice = voice;

    // Retain in Set to prevent Chrome garbage-collection bug
    activeUtterances.add(utt);
    utt.onend = () => {
      activeUtterances.delete(utt);
      processFloorSpeechQueue();
    };
    utt.onerror = () => {
      activeUtterances.delete(utt);
      processFloorSpeechQueue();
    };

    window.speechSynthesis.speak(utt);
  } catch (err) {
    console.warn("[ChamberAudio] speakAlert error:", err);
  }
}

/**
 * Speak floor speech delivered by a member or the speaker.
 * Multiple speech snippets are queued and spoken sequentially.
 */
export function speakFloorSpeech(
  text: string,
  speakerId?: string,
  speakerName?: string,
  isSpeakerRole = false
) {
  if (globalIsMuted || !text || typeof window === "undefined" || !("speechSynthesis" in window)) return;

  // Enqueue snippet
  const id = `speech-${Date.now()}-${Math.random()}`;
  floorSpeechQueue.push({ id, text: text.trim(), isSpeakerRole, speakerName });
  processFloorSpeechQueue();
}

function processFloorSpeechQueue() {
  if (globalIsMuted || floorSpeechQueue.length === 0 || isProcessingQueue) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  // If already speaking, let the onend handler pick up the next item
  if (window.speechSynthesis.speaking) return;

  const item = floorSpeechQueue.shift();
  if (!item) return;

  isProcessingQueue = true;
  try {
    window.speechSynthesis.resume();
    const utt = new SpeechSynthesisUtterance(item.text);
    utt.lang = "en-IN";

    if (item.isSpeakerRole) {
      // Dignified, authoritative Chair voice
      utt.pitch = 0.92;
      utt.rate = 0.94;
    } else {
      // Articulate parliamentarian floor debate voice
      utt.pitch = 1.05;
      utt.rate = 1.0;
    }
    utt.volume = 1.0;

    const voice = findBestVoice();
    if (voice) utt.voice = voice;

    activeUtterances.add(utt);

    const onDone = () => {
      activeUtterances.delete(utt);
      isProcessingQueue = false;
      setTimeout(processFloorSpeechQueue, 100);
    };

    utt.onend = onDone;
    utt.onerror = onDone;

    window.speechSynthesis.speak(utt);
  } catch (err) {
    isProcessingQueue = false;
    console.warn("[ChamberAudio] processFloorSpeechQueue error:", err);
  }
}

/**
 * Legacy compatible alias for existing imports.
 */
export function speakMessage(
  text: string,
  category = "general",
  cooldownMs = 0
) {
  speakAlert(text, category, false);
}
