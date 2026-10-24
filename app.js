const greeting = `Welcome to PexChic – Kuku Bingwa, your trusted partner in quality poultry.

For day-old chicks and poultry breeds, press 1.

For parent stock inquiries, press 2.

For processed chicken, press 3.

For orders, delivery inquiries, and customer support, press 4.

To speak directly to a member of our team, press 0.

Thank you for choosing PexChic – Kuku Bingwa.`;

const routes = {
  "1": {
    title: "Day-old chicks & poultry breeds",
    detail: "Breed, quantity and required date",
    message: "You selected day-old chicks and poultry breeds. Please have your preferred breed, quantity, and required date ready. A PexChic representative will confirm availability and pricing. This is a demonstration; no order has been placed."
  },
  "2": {
    title: "Parent stock inquiries",
    detail: "Stock planning, availability and pricing",
    message: "You selected parent stock inquiries. Please have the breed, quantity, and required date ready. A PexChic representative will confirm parent stock availability, lead time, and pricing."
  },
  "3": {
    title: "Processed chicken",
    detail: "Products, quantities and delivery dates",
    message: "You selected processed chicken. Please provide the product required, quantity, and preferred delivery date. A PexChic representative will confirm availability and pricing. This is a demonstration; no order has been placed."
  },
  "4": {
    title: "Orders, delivery & support",
    detail: "Order reference and delivery information",
    message: "You selected orders, delivery inquiries, and customer support. Please have your order reference, delivery location, and delivery date ready. This demonstration does not make changes to an order."
  },
  "0": {
    title: "Speak to the PexChic team",
    detail: "Representative transfer placeholder",
    message: "You selected to speak directly to a member of our team. Live transfer is not enabled in this demonstration. An approved representative number will be added before production launch."
  }
};

const state = {
  active: false,
  speaking: false,
  startedAt: 0,
  timer: null,
  idleTimer: null,
  failedAttempts: 0,
  selectedVoice: null
};

const els = {
  start: document.querySelector("#startButton"),
  end: document.querySelector("#endButton"),
  status: document.querySelector("#callStatus"),
  timer: document.querySelector("#callTimer"),
  title: document.querySelector("#promptTitle"),
  detail: document.querySelector("#promptDetail"),
  wave: document.querySelector("#wave"),
  voice: document.querySelector("#voiceBadge"),
  keys: [...document.querySelectorAll("[data-key]")],
  routes: [...document.querySelectorAll("[data-route]")]
};

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const english = voices.filter((voice) => /^en([-_]|$)/i.test(voice.lang));
  const preferred = [
    /Samantha/i, /Joanna/i, /Zira/i, /Aria/i, /Jenny/i,
    /Google UK English Female/i, /Google US English/i, /female/i
  ];
  state.selectedVoice = preferred.reduce(
    (match, pattern) => match || english.find((voice) => pattern.test(voice.name)),
    null
  ) || english[0] || voices[0] || null;

  if (state.selectedVoice) {
    const cleanName = state.selectedVoice.name.replace(/Microsoft |Google /gi, "").split(" - ")[0];
    els.voice.textContent = `${cleanName} voice`;
  } else {
    els.voice.textContent = "Device English voice";
  }
}

pickVoice();
if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = pickVoice;

function setSpeaking(value) {
  state.speaking = value;
  els.wave.classList.toggle("speaking", value);
}

function speak(text, onEnd) {
  if (!window.speechSynthesis) {
    setSpeaking(false);
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.94;
  utterance.pitch = 1.02;
  if (state.selectedVoice) utterance.voice = state.selectedVoice;
  utterance.onstart = () => setSpeaking(true);
  utterance.onend = () => { setSpeaking(false); onEnd?.(); };
  utterance.onerror = () => { setSpeaking(false); onEnd?.(); };
  window.speechSynthesis.speak(utterance);
}

function setPrompt(title, detail) {
  els.title.textContent = title;
  els.detail.textContent = detail;
}

function scheduleNoInput() {
  clearTimeout(state.idleTimer);
  if (!state.active) return;
  state.idleTimer = setTimeout(() => {
    if (!state.active || state.speaking) {
      scheduleNoInput();
      return;
    }
    state.failedAttempts += 1;
    if (state.failedAttempts >= 3) {
      setPrompt("No selection received", "The demonstration has ended after three attempts.");
      speak("We did not receive a selection. Thank you for calling PexChic – Kuku Bingwa. Goodbye.", endDemo);
      return;
    }
    setPrompt("No input received", `Please choose 1, 2, 3, 4, or 0. Attempt ${state.failedAttempts + 1} of 3.`);
    speak("We did not receive a selection. Please listen to the menu and try again.", () => speak(greeting, scheduleNoInput));
  }, 14000);
}

function updateTimer() {
  const elapsed = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");
  els.timer.textContent = `${minutes}:${seconds}`;
}

function startDemo() {
  state.active = true;
  state.failedAttempts = 0;
  state.startedAt = Date.now();
  clearInterval(state.timer);
  state.timer = setInterval(updateTimer, 1000);
  updateTimer();
  els.start.hidden = true;
  els.end.hidden = false;
  els.status.textContent = "Demo active";
  els.status.classList.add("live");
  setPrompt("Welcome to PexChic", "Listen to the greeting, then choose one digit.");
  speak(greeting, scheduleNoInput);
}

function endDemo() {
  state.active = false;
  clearInterval(state.timer);
  clearTimeout(state.idleTimer);
  window.speechSynthesis?.cancel();
  setSpeaking(false);
  els.start.hidden = false;
  els.start.innerHTML = '<span class="phone-glyph" aria-hidden="true">↗</span>Restart IVR Demo';
  els.end.hidden = true;
  els.status.textContent = "Demo ended";
  els.status.classList.remove("live");
  els.routes.forEach((item) => item.classList.remove("active"));
}

function beep(key) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const frequencies = { "1": 697, "2": 697, "3": 697, "4": 770, "5": 770, "6": 770, "7": 852, "8": 852, "9": 852, "*": 941, "0": 941, "#": 941 };
    osc.frequency.value = frequencies[key] || 770;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => ctx.close();
  } catch (_) { /* Sound feedback is optional. */ }
}

function flashKey(key) {
  const button = els.keys.find((item) => item.dataset.key === key);
  if (!button) return;
  button.classList.add("pressed");
  setTimeout(() => button.classList.remove("pressed"), 160);
}

function selectKey(key) {
  flashKey(key);
  beep(key);
  if (!state.active) {
    setPrompt("Start the demo first", "Tap “Start IVR Demo”, then make a selection.");
    return;
  }
  if (state.speaking) window.speechSynthesis?.cancel();
  clearTimeout(state.idleTimer);

  const route = routes[key];
  if (route) {
    state.failedAttempts = 0;
    els.routes.forEach((item) => item.classList.toggle("active", item.dataset.route === key));
    setPrompt(route.title, route.detail);
    speak(route.message, () => {
      if (!state.active) return;
      setPrompt("Selection complete", "Choose another key, or end the demonstration.");
      scheduleNoInput();
    });
    return;
  }

  state.failedAttempts += 1;
  if (state.failedAttempts >= 3) {
    setPrompt("Invalid selection", "The demonstration has ended after three attempts.");
    speak("We are unable to process your selection. Thank you for calling PexChic – Kuku Bingwa. Goodbye.", endDemo);
    return;
  }
  setPrompt("Invalid selection", `Please choose 1, 2, 3, 4, or 0. Attempt ${state.failedAttempts + 1} of 3.`);
  speak("That was not a valid selection. Please press 1, 2, 3, 4, or 0.", scheduleNoInput);
}

els.start.addEventListener("click", startDemo);
els.end.addEventListener("click", endDemo);
els.keys.forEach((button) => button.addEventListener("click", () => selectKey(button.dataset.key)));
window.addEventListener("keydown", (event) => {
  if (/^[0-9*#]$/.test(event.key)) selectKey(event.key);
});
window.addEventListener("beforeunload", () => window.speechSynthesis?.cancel());
