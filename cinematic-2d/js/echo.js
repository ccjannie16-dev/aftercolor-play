"use strict";

/* AFTERCOLOR — Cinematic 2D — Abby echo system (Spec §7) */

const ECHO_PLACEMENTS = {
  slippers: { left: "8%", top: "65%", pan: -0.55, volume: 0.78 },
  come_sit:  { left: "58%", top: "38%", pan: 0.1, volume: 0.72 },
  remote:    { left: "42%", top: "55%", pan: -0.1, volume: 0.75 },
  store:     { left: "78%", top: "42%", pan: 0.35, volume: 0.75 },
  take_time: { left: "62%", top: "40%", pan: 0.2, volume: 0.7 },
  cat_fish:  { left: "30%", top: "35%", pan: -0.2, volume: 0.72 },
  warmth:    { left: "20%", top: "30%", pan: -0.3, volume: 0.7 }
};

const ECHO_TEXTS = {
  slippers:  "Bibo, did you move my slippers again?",
  come_sit:  "Bibo, come sit. The light’s good right now.",
  remote:    "Bibo, you hid the remote in the couch again, didn’t you?",
  store:     "Bibo, I’m going to the store. Do you need anything?",
  take_time: "Bibo, it’s okay. Take your time.",
  cat_fish:  "NOT FISH.",
  warmth:    "Wear the warm jacket."
};

let audioCtx = null;
const activeEchoes = new Set();

function getAudioContext() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

function playEchoPan(pan, volume) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const doPlay = () => {
    try {
      const duration = 1.8;
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.12;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 420;
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      const settingsVolume = window.AftercolorAudioSettings ? Number(window.AftercolorAudioSettings.soundVolume) : 1;
      gain.gain.linearRampToValueAtTime(volume * 0.025 * Math.max(0, Math.min(1, settingsVolume)), ctx.currentTime + 0.25);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      panner.pan.value = pan;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);
      source.start(ctx.currentTime);
      source.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(doPlay).catch(() => {});
  } else {
    doPlay();
  }
}

function primeAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

function getAudioState() {
  return audioCtx ? audioCtx.state : "not-created";
}

/* Resume AudioContext on any user gesture so echoes can play */
document.addEventListener("click",   primeAudio);
document.addEventListener("keydown", primeAudio);

function triggerEcho(echoId, viewport, textOverride) {
  const placement = ECHO_PLACEMENTS[echoId];
  const text = textOverride || ECHO_TEXTS[echoId];
  if (!placement || !text || !viewport) return { cancel() {} };

  const el = document.createElement("div");
  el.className = "echo-text";
  el.textContent = text;
  el.style.left = placement.left;
  el.style.top = placement.top;
  el.setAttribute("aria-live", "polite");
  el.setAttribute("role", "status");

  viewport.appendChild(el);
  const saved = window.AftercolorState && window.AftercolorState.load ? window.AftercolorState.load() : null;
  if (!saved || !saved.settings || (!saved.settings.muted && Number(saved.settings.soundVolume ?? 80) > 0)) playEchoPan(placement.pan, placement.volume);

  let cancelled = false;
  const handle = {
    cancel() {
      if (cancelled) return;
      cancelled = true;
      clearTimeout(timer);
      activeEchoes.delete(handle);
      el.remove();
    }
  };
  const timer = setTimeout(() => handle.cancel(), 4200);
  activeEchoes.add(handle);
  return handle;
}

function cancelAll() {
  Array.from(activeEchoes).forEach((handle) => handle.cancel());
}

window.AftercolorEcho = { triggerEcho, cancelAll, ECHO_PLACEMENTS, ECHO_TEXTS, primeAudio, getAudioState };
