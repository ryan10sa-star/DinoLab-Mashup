/* ======================================================================
   DinoLab Mashup — Main Application
   Features: XP System, Quiz, Mystery Eggs, Racing AI, Fossil Timer,
             Particles, Screen Shake, Sound FX, Discovery Gallery
   ====================================================================== */

const STORAGE_KEY = "dinolab-state-v2";

// ===== Sound Effects System =====
let audioCtx = null;
let soundEnabled = true;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case "click":
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
        break;

      case "dig":
        osc.type = "triangle";
        osc.frequency.value = 200;
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        break;

      case "fossil":
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
        break;

      case "rare":
        playChord([523, 659, 784, 1047], 0.12, 0.5, "sine");
        return;

      case "victory":
        playVictoryFanfare();
        return;

      case "roar":
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        break;

      case "boost":
        osc.type = "square";
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        break;

      case "levelup":
        playChord([523, 659, 784, 1047, 1319], 0.15, 0.6, "sine");
        return;

      case "eggcrack":
        osc.type = "triangle";
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
        break;

      case "correct":
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
        break;

      case "wrong":
        osc.type = "square";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        break;

      case "combo":
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        break;

      default:
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }
  } catch (e) {
    /* Audio not supported */
  }
}

function playChord(notes, gap, dur, type) {
  const ctx = getAudioCtx();
  notes.forEach((freq, i) => {
    setTimeout(() => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type || "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (dur || 0.3));
        osc.start();
        osc.stop(ctx.currentTime + (dur || 0.3));
      } catch (e) {}
    }, i * (gap * 1000 || 120));
  });
}

function playVictoryFanfare() {
  playChord([523, 659, 784, 1047], 0.12, 0.4, "sine");
}

// ===== XP & Level System =====
const LEVEL_THRESHOLDS = [0, 50, 150, 350, 700, 1200, 2000];
const LEVEL_TITLES = [
  { emoji: "🥚", name: "Egg" },
  { emoji: "🐣", name: "Hatchling" },
  { emoji: "🦎", name: "Raptor" },
  { emoji: "🦖", name: "T-Rex" },
  { emoji: "👑", name: "Dino King" },
  { emoji: "⭐", name: "Legend" },
  { emoji: "🌟", name: "Mega Legend" },
];

function getLevelForXP(xp) {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  return level;
}

function addXP(amount, sourceEl) {
  const oldLevel = getLevelForXP(state.xp);
  state.xp += amount;
  const newLevel = getLevelForXP(state.xp);
  state.level = newLevel;
  saveState();
  refreshXPBar();

  // Float the +XP number
  if (sourceEl) {
    const rect = sourceEl.getBoundingClientRect();
    spawnFloatNumber(`+${amount} XP`, rect.left + rect.width / 2, rect.top);
  } else {
    spawnFloatNumber(`+${amount} XP`, window.innerWidth / 2, window.innerHeight / 2);
  }

  // Level up!
  if (newLevel > oldLevel) {
    setTimeout(() => {
      playSound("levelup");
      triggerConfetti(50);
      shakeScreen();
      const title = LEVEL_TITLES[newLevel] || LEVEL_TITLES[LEVEL_TITLES.length - 1];
      spawnFloatNumber(`${title.emoji} LEVEL UP! ${title.name}!`, window.innerWidth / 2, 150);
      document.body.classList.add("level-up-flash");
      setTimeout(() => document.body.classList.remove("level-up-flash"), 800);

      // Award egg on level up
      awardEgg(newLevel >= 4 ? "legendary" : newLevel >= 2 ? "rare" : "common");
    }, 300);
  }
}

function refreshXPBar() {
  const level = getLevelForXP(state.xp);
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level] + 500;
  const progress = ((state.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  const title = LEVEL_TITLES[level] || LEVEL_TITLES[LEVEL_TITLES.length - 1];

  if (elements.xp_fill) elements.xp_fill.style.width = `${Math.min(progress, 100)}%`;
  if (elements.xp_label) elements.xp_label.textContent = `${state.xp} / ${nextThreshold} XP`;
  if (elements.level_badge) elements.level_badge.textContent = `${title.emoji} ${title.name}`;
}

// ===== Particle & Juice System =====
function shakeScreen() {
  const main = document.getElementById("app-main");
  if (!main) return;
  main.classList.remove("screen-shake");
  void main.offsetWidth; // force reflow
  main.classList.add("screen-shake");
  setTimeout(() => main.classList.remove("screen-shake"), 400);
}

function spawnParticles(x, y, count, color) {
  const container = document.getElementById("particle-container");
  if (!container) return;
  const colors = color
    ? [color]
    : ["#fbbf24", "#34d399", "#38bdf8", "#f87171", "#a78bfa", "#f472b6"];

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 40 + Math.random() * 60;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty("--dx", `${dx}px`);
    p.style.setProperty("--dy", `${dy}px`);
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.width = `${6 + Math.random() * 6}px`;
    p.style.height = p.style.width;
    container.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

function spawnFloatNumber(text, x, y) {
  const container = document.getElementById("float-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = "float-number";
  el.textContent = text;
  el.style.left = `${x - 40}px`;
  el.style.top = `${y}px`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function triggerConfetti(count) {
  const container = elements.confetti_container;
  if (!container) return;
  const colors = ["#fbbf24", "#34d399", "#38bdf8", "#f87171", "#a78bfa", "#f472b6"];
  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = `${Math.random() * 100}%`;
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = `${Math.random() * 0.5}s`;
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(c);
    setTimeout(() => c.remove(), 3500);
  }
}

// ===== Game Data =====
const fossilSets = {
  Desert: ["Raptor Claw", "Tooth Fragment", "Ancient Egg"],
  Volcano: ["Lava Bone", "Ash Skull", "Fire Crest"],
  IceAge: ["Frozen Rib", "Mammoth Tusk", "Frost Paw"],
};

const dailyQuestPool = [
  "Discover 3 different dinosaurs",
  "Find one complete fossil set",
  "Earn at least a Silver race medal",
  "Get 3 quiz answers right",
  "Hatch a mystery egg",
  "Explore the prehistoric gallery",
];

const initialState = {
  xp: 0,
  level: 0,
  dinos: [],
  cards: [],
  bestDistance: 0,
  raceBestMedal: "None",
  completedFossilSets: [],
  cupProgress: {},
  dailyQuest: "",
  dailyQuestDate: "",
  streak: 0,
  lastQuestCompleteDate: "",
  discoveredDinos: [],
  quizHighScore: 0,
  quizBestStreak: 0,
  eggs: { common: 0, rare: 0, legendary: 0 },
  eggLog: [],
  battleWins: 0,
  battleLosses: 0,
  battleStreak: 0,
  parent: { pin: "", locked: false },
};

let state = loadState();
let assetManifest = { assets: [] };
let activeHunt = [];
let foundInHunt = new Set();
let raceIntervalId = null;
let raceMsLeft = 0;
let raceDistance = 0;
let aiDistance = 0;
let aiSpeedBase = 0;
let fossilTimerId = null;
let fossilTimeLeft = 0;
let fossilCombo = 0;

// Quiz state
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizStreak = 0;
let quizActive = false;

const elements = {};

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  loadAssetManifest().then(() => {
    setupTabs();
    setupFossilSetOptions();
    attachEventListeners();
    ensureDailyQuest();
    refreshAll();
    renderDiscoveryGallery();
    refreshXPBar();
    refreshEggInventory();
    initBattle();
    registerServiceWorker();
  });
});

function cacheElements() {
  const ids = [
    "fossil-set", "new-hunt-btn", "dig-grid", "fossil-status",
    "fossil-timer", "fossil-combo",
    "boost-btn", "race-status", "race-timer",
    "racer", "ai-racer", "speed-meter", "speed-label", "race-track",
    "obstacle-container",
    "card-list", "collection-summary", "cup-list", "cup-status", "cup-fill",
    "poster-player", "make-poster-btn", "download-poster", "poster-canvas",
    "daily-quest", "complete-quest-btn", "streak-status",
    "parent-pin", "set-pin-btn", "toggle-lock-btn", "unlock-pin", "unlock-btn", "parent-status",
    "confetti-container", "sound-toggle",
    "discovery-grid", "dino-modal", "modal-close", "modal-img",
    "modal-title", "modal-period", "modal-facts", "modal-next",
    "xp-fill", "xp-label", "level-badge",
    "start-quiz-btn", "quiz-question", "quiz-answers", "quiz-feedback",
    "quiz-streak-display", "quiz-score-display",
    "hatch-btn", "hatch-result", "egg-log",
    "egg-common-count", "egg-rare-count", "egg-legendary-count",
    "app-header",
    "battle-player-card", "battle-player-emoji", "battle-player-name",
    "battle-player-stats", "battle-player-hp", "battle-player-hp-label",
    "battle-enemy-card", "battle-enemy-emoji", "battle-enemy-name",
    "battle-enemy-stats", "battle-enemy-hp", "battle-enemy-hp-label",
    "battle-log", "battle-select-btn", "battle-attack-btn", "battle-special-btn",
    "battle-result", "battle-record",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) elements[id.replace(/-/g, "_")] = el;
  });
}

async function loadAssetManifest() {
  try {
    const res = await fetch("data/assets-manifest.json");
    assetManifest = await res.json();
  } catch {
    assetManifest = { assets: [] };
  }
}

// ===== Tab Navigation =====
function setupTabs() {
  const tabBar = document.getElementById("tab-bar");
  if (!tabBar) return;
  tabBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    const tabName = btn.dataset.tab;
    playSound("click");

    // Update active tab button
    tabBar.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");

    // Show matching content
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    const target = document.getElementById(`tab-${tabName}`);
    if (target) target.classList.add("active");
  });
}

function setupFossilSetOptions() {
  Object.keys(fossilSets).forEach((setName) => {
    const opt = document.createElement("option");
    opt.value = setName;
    opt.textContent = `🗺️ ${setName}`;
    elements.fossil_set?.append(opt);
  });
}

function attachEventListeners() {
  elements.new_hunt_btn?.addEventListener("click", () => startNewHunt());
  elements.boost_btn?.addEventListener("click", () => {
    // Auto-start race on first boost tap
    if (!raceIntervalId) startRace();
    boostRacer();
  });
  elements.make_poster_btn?.addEventListener("click", () => {
    renderPoster();
    markCupStep("make_poster", true);
    addXP(5, elements.make_poster_btn);
    saveState();
    refreshCup();
  });
  elements.complete_quest_btn?.addEventListener("click", completeDailyQuest);
  elements.set_pin_btn?.addEventListener("click", setParentPin);
  elements.toggle_lock_btn?.addEventListener("click", toggleParentLock);
  elements.unlock_btn?.addEventListener("click", unlockParent);

  // Sound toggle
  elements.sound_toggle?.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    if (elements.sound_toggle) elements.sound_toggle.textContent = soundEnabled ? "🔊" : "🔇";
    if (soundEnabled) playSound("click");
  });

  // Modal
  elements.modal_close?.addEventListener("click", closeModal);
  elements.modal_next?.addEventListener("click", showRandomDino);
  elements.dino_modal?.addEventListener("click", (e) => {
    if (e.target === elements.dino_modal) closeModal();
  });

  // Quiz
  elements.start_quiz_btn?.addEventListener("click", startQuiz);

  // Eggs
  elements.hatch_btn?.addEventListener("click", hatchEgg);

  // Battles
  elements.battle_select_btn?.addEventListener("click", selectBattleCard);
  elements.battle_attack_btn?.addEventListener("click", () => performAttack(false));
  elements.battle_special_btn?.addEventListener("click", () => performAttack(true));
}

function refreshAll() {
  refreshCollection();
  refreshRaceStatus();
  refreshCup();
  refreshQuest();
  refreshLockState();
}

// ===== Dino Discovery Gallery with Fun Facts =====
const dinoFacts = {
  tyrannosaurus: {
    name: "Tyrannosaurus Rex",
    period: "Late Cretaceous (68-66 million years ago)",
    facts: [
      { emoji: "👑", text: "T-Rex means 'Tyrant Lizard King'!" },
      { emoji: "🦷", text: "Had 60 huge teeth, some as long as bananas!" },
      { emoji: "🏃", text: "Could run about 12 mph — faster than most humans!" },
      { emoji: "👃", text: "Amazing sense of smell to find food from miles away" },
    ],
  },
  triceratops: {
    name: "Triceratops",
    period: "Late Cretaceous (68-66 million years ago)",
    facts: [
      { emoji: "🦏", text: "'Three-Horned Face' — it had 3 horns!" },
      { emoji: "🛡️", text: "Frill on its head was solid bone for protection" },
      { emoji: "🌿", text: "Plant-eater with a beak like a parrot" },
      { emoji: "📏", text: "Up to 30 feet long — as big as a school bus!" },
    ],
  },
  stegosaurus: {
    name: "Stegosaurus",
    period: "Late Jurassic (155-150 million years ago)",
    facts: [
      { emoji: "🔺", text: "17 bony plates helped control body temperature" },
      { emoji: "⚔️", text: "Tail had 4 sharp spikes called a 'thagomizer'!" },
      { emoji: "🧠", text: "Brain the size of a walnut for such a big animal!" },
      { emoji: "🦕", text: "Heavy as a car but only as tall as an elephant" },
    ],
  },
  diplodocus: {
    name: "Diplodocus",
    period: "Late Jurassic (154-152 million years ago)",
    facts: [
      { emoji: "📏", text: "One of the longest dinos — up to 85 feet long!" },
      { emoji: "🦒", text: "Super long neck to reach leaves high in trees" },
      { emoji: "💨", text: "Could crack its tail like a whip — BOOM!" },
      { emoji: "🥬", text: "Ate plants all day — needed tons of food" },
    ],
  },
  mammoth: {
    name: "Woolly Mammoth",
    period: "Ice Age (400,000-4,000 years ago)",
    facts: [
      { emoji: "🧥", text: "Thick wool up to 3 feet long for the Ice Age!" },
      { emoji: "🦷", text: "Tusks grew up to 15 feet — curved spirals!" },
      { emoji: "❄️", text: "Lived alongside early humans who painted them" },
      { emoji: "🐘", text: "Close relative of modern elephants!" },
    ],
  },
  smilodon: {
    name: "Smilodon (Saber-Tooth Cat)",
    period: "Ice Age (2.5 million-10,000 years ago)",
    facts: [
      { emoji: "🦁", text: "7-inch fangs — longer than a banana!" },
      { emoji: "💪", text: "Stronger than modern lions, built like a wrestler" },
      { emoji: "🎯", text: "Used huge teeth to take down mammoths!" },
      { emoji: "🐱", text: "Not actually a tiger — its own special cat!" },
    ],
  },
  pteranodon: {
    name: "Pteranodon",
    period: "Late Cretaceous (86-84 million years ago)",
    facts: [
      { emoji: "✈️", text: "Wingspan up to 23 feet — wider than a plane!" },
      { emoji: "🦅", text: "Not a dinosaur — a flying reptile!" },
      { emoji: "🐟", text: "Scooped fish from the ocean like a pelican" },
      { emoji: "👒", text: "Cool crest on its head — mystery why!" },
    ],
  },
  ankylosaurus: {
    name: "Ankylosaurus",
    period: "Late Cretaceous (68-66 million years ago)",
    facts: [
      { emoji: "🛡️", text: "Covered in bony armor like a living tank!" },
      { emoji: "🔨", text: "Tail club could break bones — even T-Rex fled!" },
      { emoji: "🐢", text: "Built low so predators couldn't flip it" },
      { emoji: "🧱", text: "Even its eyelids had armor!" },
    ],
  },
  ichthyosaurus: {
    name: "Ichthyosaurus",
    period: "Early Jurassic (200-190 million years ago)",
    facts: [
      { emoji: "🐬", text: "Looked like a dolphin but was a marine reptile!" },
      { emoji: "👀", text: "Biggest eyes of any animal ever!" },
      { emoji: "🏊", text: "One of the fastest prehistoric swimmers" },
      { emoji: "🦎", text: "Gave birth to live babies, not eggs!" },
    ],
  },
  trilobite: {
    name: "Trilobite",
    period: "Cambrian to Permian (521-252 million years ago)",
    facts: [
      { emoji: "🦀", text: "First animals with eyes — made of crystal!" },
      { emoji: "📅", text: "Lived 270 million years — way longer than dinos!" },
      { emoji: "🪲", text: "Related to crabs, lobsters, and insects" },
      { emoji: "🌊", text: "Lived on the ocean floor eating tiny food" },
    ],
  },
  fossil: {
    name: "Ancient Fossil",
    period: "Millions of years ago",
    facts: [
      { emoji: "🪨", text: "Bones turn to stone over millions of years!" },
      { emoji: "🔬", text: "Paleontologists study fossils about the past" },
      { emoji: "🗺️", text: "Found on every continent — even Antarctica!" },
      { emoji: "💎", text: "Oldest fossils are over 3.5 billion years old!" },
    ],
  },
  egg: {
    name: "Dinosaur Egg",
    period: "Mesozoic Era (252-66 million years ago)",
    facts: [
      { emoji: "🥚", text: "Dino eggs came in round, oval, and tube shapes!" },
      { emoji: "📏", text: "Biggest were about football-sized!" },
      { emoji: "🪺", text: "Some dinos built nests like birds" },
      { emoji: "🐣", text: "Babies hatched just like birds today!" },
    ],
  },
  default: {
    name: "Prehistoric Creature",
    period: "Millions of years ago",
    facts: [
      { emoji: "🦕", text: "Dinosaurs ruled Earth for 160 million years!" },
      { emoji: "🌍", text: "Fossils teach us about ancient life" },
      { emoji: "🔍", text: "New dino species discovered every year!" },
      { emoji: "⭐", text: "This lived millions of years ago!" },
    ],
  },
};

function getFactsForAsset(asset) {
  const title = (asset.title + " " + asset.subject + " " + (asset.altText || "")).toLowerCase();
  for (const [key, data] of Object.entries(dinoFacts)) {
    if (key !== "default" && title.includes(key)) return data;
  }
  if (title.includes("egg")) return dinoFacts.egg;
  if (title.includes("fossil") || title.includes("skeleton")) return dinoFacts.fossil;
  if (title.includes("mammoth")) return dinoFacts.mammoth;
  if (title.includes("saber") || title.includes("smilodon")) return dinoFacts.smilodon;
  return dinoFacts.default;
}

function renderDiscoveryGallery() {
  if (!elements.discovery_grid) return;
  elements.discovery_grid.innerHTML = "";
  const shuffled = [...assetManifest.assets].sort(() => Math.random() - 0.5);
  shuffled.forEach((asset) => {
    const facts = getFactsForAsset(asset);
    const card = document.createElement("div");
    card.className = "discovery-card";
    card.innerHTML = `
      <img src="${asset.formats.web}" alt="${asset.altText || asset.subject}" loading="lazy" />
      <div class="card-label">${facts.name}</div>
    `;
    card.addEventListener("click", (e) => {
      openDinoModal(asset);
      spawnParticles(e.clientX, e.clientY, 8);
    });
    elements.discovery_grid.append(card);
  });
}

function openDinoModal(asset) {
  playSound("click");
  const facts = getFactsForAsset(asset);
  if (elements.modal_img) elements.modal_img.src = asset.formats.web;
  if (elements.modal_title) elements.modal_title.textContent = facts.name;
  if (elements.modal_period) elements.modal_period.textContent = `🕐 ${facts.period}`;
  if (elements.modal_facts) {
    elements.modal_facts.innerHTML = facts.facts
      .map((f) => `<div class="fact-item"><span class="fact-emoji">${f.emoji}</span>${f.text}</div>`)
      .join("");
  }
  elements.dino_modal?.classList.remove("hidden");

  // Track discovery
  if (!state.discoveredDinos) state.discoveredDinos = [];
  if (!state.discoveredDinos.includes(facts.name)) {
    state.discoveredDinos.push(facts.name);
    addXP(10, elements.modal_title);

    if (state.discoveredDinos.length >= 5) {
      unlockCardIfNew("Junior Paleontologist", "Rare");
      markCupStep("create_dino", true);
    }
    if (state.discoveredDinos.length >= 10) {
      unlockCardIfNew("Dino Expert", "Epic");
    }
    // Random egg reward
    if (Math.random() < 0.3) awardEgg("common");

    saveState();
    refreshCollection();
    refreshCup();
  }
}

function closeModal() {
  elements.dino_modal?.classList.add("hidden");
}

function showRandomDino() {
  if (assetManifest.assets.length === 0) return;
  const asset = assetManifest.assets[Math.floor(Math.random() * assetManifest.assets.length)];
  openDinoModal(asset);
  playSound("fossil");
}

// ===== Fossil Hunt with Timer & Combos =====
function startNewHunt() {
  // Clear old timer
  if (fossilTimerId) clearInterval(fossilTimerId);

  const setName = elements.fossil_set?.value || "Desert";
  const fossils = fossilSets[setName];
  foundInHunt = new Set();
  fossilCombo = 0;
  fossilTimeLeft = 30;

  // Mix fossils with decoys — 3×3 grid = 9 tiles
  const pool = [...fossils, ...fossils, "Mud", "Rock", "Sand", "Amber", "Leaf", "Shell"];
  activeHunt = pool.sort(() => Math.random() - 0.5).slice(0, 9);

  if (!elements.dig_grid) return;
  elements.dig_grid.innerHTML = "";

  const fossilAssets = assetManifest.assets.filter(
    (a) => a.category === "fossil-photo" || a.title.toLowerCase().includes("fossil")
  );

  activeHunt.forEach((item, idx) => {
    const btn = document.createElement("button");
    btn.className = "dig-tile";
    btn.textContent = "🪨";
    btn.dataset.item = item;
    btn.dataset.idx = idx;
    if (fossils.includes(item) && fossilAssets.length > 0) {
      btn.dataset.imgSrc = fossilAssets[idx % fossilAssets.length].formats.web;
    }
    btn.addEventListener("click", () => revealDigTile(btn, item, setName));
    elements.dig_grid.append(btn);
  });

  updateFossilStatus(setName);
  updateFossilTimer();
  updateFossilCombo();

  // Start countdown
  fossilTimerId = setInterval(() => {
    fossilTimeLeft--;
    updateFossilTimer();
    if (fossilTimeLeft <= 0) {
      clearInterval(fossilTimerId);
      fossilTimerId = null;
      // Disable remaining tiles
      elements.dig_grid?.querySelectorAll(".dig-tile:not(:disabled)").forEach((t) => {
        t.disabled = true;
        t.style.opacity = "0.4";
      });
      if (elements.fossil_status) elements.fossil_status.textContent = "⏰ Time's up! Try again!";
    }
  }, 1000);
}

function updateFossilTimer() {
  if (!elements.fossil_timer) return;
  elements.fossil_timer.textContent = `⏱️ ${fossilTimeLeft}s`;
  if (fossilTimeLeft <= 10) {
    elements.fossil_timer.classList.add("warning");
  } else {
    elements.fossil_timer.classList.remove("warning");
  }
}

function updateFossilCombo() {
  if (!elements.fossil_combo) return;
  if (fossilCombo >= 2) {
    elements.fossil_combo.textContent = `🔥 x${fossilCombo}`;
    elements.fossil_combo.classList.add("active");
    setTimeout(() => elements.fossil_combo.classList.remove("active"), 300);
  } else {
    elements.fossil_combo.textContent = "";
  }
}

function revealDigTile(button, item, setName) {
  if (button.disabled || fossilTimeLeft <= 0) return;
  button.disabled = true;
  playSound("dig");
  shakeScreen();

  const rect = button.getBoundingClientRect();
  spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 6);

  const fossils = fossilSets[setName];
  const isFossil = fossils.includes(item);
  const isRare = isFossil && Math.random() < 0.1; // 10% rare chance

  button.classList.add("revealed");

  if (isFossil && button.dataset.imgSrc) {
    button.innerHTML = `<img src="${button.dataset.imgSrc}" alt="${item}" />`;
    button.classList.add("found-fossil");
    if (isRare) button.classList.add("rare-fossil");
    foundInHunt.add(item);
    playSound(isRare ? "rare" : "fossil");
    fossilCombo++;
    updateFossilCombo();

    // XP with combo multiplier
    const xpBase = isRare ? 25 : 15;
    const xpBonus = Math.min(fossilCombo, 5);
    addXP(xpBase + xpBonus * 3, button);

    if (isRare) {
      spawnFloatNumber("⭐ RARE FOSSIL! ⭐", rect.left + rect.width / 2, rect.top - 20);
      triggerConfetti(15);
    }

    if (fossilCombo >= 3) playSound("combo");
  } else {
    button.textContent = isFossil ? `🦴 ${item}` : `💨 ${item}`;
    if (isFossil) {
      button.classList.add("found-fossil");
      foundInHunt.add(item);
      playSound("fossil");
      fossilCombo++;
      addXP(15, button);
    } else {
      fossilCombo = 0; // Reset combo on miss
      updateFossilCombo();
    }
  }

  updateFossilStatus(setName);

  const complete = fossils.every((f) => foundInHunt.has(f));
  if (complete) {
    if (fossilTimerId) clearInterval(fossilTimerId);
    fossilTimerId = null;

    if (!state.completedFossilSets.includes(setName)) {
      state.completedFossilSets.push(setName);
      unlockCardIfNew(`Fossil-${setName}`, "Epic");
    }
    markCupStep("fossil_set", true);
    addXP(50, elements.fossil_status);
    saveState();
    refreshCollection();
    refreshCup();
    if (elements.fossil_status) elements.fossil_status.textContent = `🎉 Set complete! Card unlocked!`;
    triggerConfetti(40);
    playSound("victory");
    awardEgg("common");
    if (fossilCombo >= 3) awardEgg("rare");
  }
}

function updateFossilStatus(setName) {
  const total = fossilSets[setName].length;
  if (elements.fossil_status) {
    elements.fossil_status.textContent = `Found ${foundInHunt.size}/${total} in ${setName}`;
  }
}

// ===== Racing with AI & Obstacles =====
function startRace() {
  if (raceIntervalId) return;

  raceMsLeft = 10000;
  raceDistance = 0;
  aiDistance = 0;
  aiSpeedBase = 2 + Math.random() * 2; // AI randomized difficulty

  elements.boost_btn && (elements.boost_btn.disabled = false);
  if (elements.race_timer) elements.race_timer.textContent = "⏱️ 10s";
  if (elements.racer) elements.racer.style.left = "5%";
  if (elements.ai_racer) elements.ai_racer.style.left = "5%";
  if (elements.obstacle_container) elements.obstacle_container.innerHTML = "";

  let obstacleTimer = 0;

  raceIntervalId = setInterval(() => {
    raceMsLeft -= 100;

    // AI movement with variation
    const aiSpeed = aiSpeedBase + Math.random() * 1.5;
    aiDistance += aiSpeed;
    const aiProgress = Math.min(aiDistance / 150, 1);
    if (elements.ai_racer) elements.ai_racer.style.left = `${5 + aiProgress * 80}%`;

    // Update timer
    if (elements.race_timer) {
      elements.race_timer.textContent = `⏱️ ${(raceMsLeft / 1000).toFixed(1)}s`;
    }

    // Spawn obstacles every ~2 seconds
    obstacleTimer += 100;
    if (obstacleTimer >= 2000) {
      obstacleTimer = 0;
      spawnObstacle();
    }

    // Update speed meter
    updateSpeedMeter();

    if (raceMsLeft <= 0) finishRace();
  }, 100);
}

function spawnObstacle() {
  if (!elements.obstacle_container) return;
  const obstacles = ["🌋", "🪨", "🌵", "🌊", "☄️"];
  const ob = document.createElement("div");
  ob.className = "race-obstacle";
  ob.textContent = obstacles[Math.floor(Math.random() * obstacles.length)];
  ob.style.top = `${10 + Math.random() * 70}%`;
  elements.obstacle_container.appendChild(ob);
  setTimeout(() => ob.remove(), 3200);
}

function boostRacer() {
  if (!raceIntervalId) return;
  playSound("boost");

  raceDistance += 5 + Math.random() * 3;
  const progress = Math.min(raceDistance / 150, 1);
  if (elements.racer) {
    elements.racer.style.left = `${5 + progress * 80}%`;
    elements.racer.classList.add("boosting");
    setTimeout(() => elements.racer.classList.remove("boosting"), 150);
  }

  if (elements.race_status) {
    elements.race_status.textContent = `${Math.floor(raceDistance)}m`;
  }

  // Mini particles on boost
  if (elements.racer) {
    const rect = elements.racer.getBoundingClientRect();
    spawnParticles(rect.left, rect.top + rect.height / 2, 3, "#f87171");
  }

  updateSpeedMeter();
}

function updateSpeedMeter() {
  const speed = Math.min(raceDistance / 150, 1) * 100;
  if (elements.speed_meter) elements.speed_meter.style.setProperty("--speed", `${speed}%`);
  if (elements.speed_label) elements.speed_label.textContent = `${Math.floor(speed * 1.2)} mph`;
}

function finishRace() {
  clearInterval(raceIntervalId);
  raceIntervalId = null;
  if (elements.boost_btn) elements.boost_btn.disabled = true;

  const distance = Math.floor(raceDistance);
  const aiDist = Math.floor(aiDistance);
  const wonAgainstAI = distance > aiDist;
  const medal = distance >= 150 ? "Gold" : distance >= 100 ? "Silver" : distance >= 60 ? "Bronze" : "None";

  if (elements.race_timer) {
    const emoji = { Gold: "🥇", Silver: "🥈", Bronze: "🥉", None: "😅" }[medal];
    const vs = wonAgainstAI ? " — YOU WIN!" : ` — AI wins (${aiDist}m)`;
    elements.race_timer.textContent = `${emoji} ${distance}m ${medal}!${vs}`;
  }

  // XP
  const xpMap = { Gold: 75, Silver: 40, Bronze: 20, None: 5 };
  addXP(xpMap[medal] + (wonAgainstAI ? 15 : 0), elements.race_timer);

  if (distance > state.bestDistance) {
    state.bestDistance = distance;
    unlockCardIfNew("Ghost Champion", "Rare");
  }

  const ranks = ["None", "Bronze", "Silver", "Gold"];
  if (ranks.indexOf(medal) > ranks.indexOf(state.raceBestMedal)) {
    state.raceBestMedal = medal;
  }

  if (medal === "Silver" || medal === "Gold") {
    markCupStep("race_medal", true);
    triggerConfetti(medal === "Gold" ? 50 : 25);
    playSound("victory");
    shakeScreen();
    if (medal === "Gold") awardEgg("rare");
  }

  if (wonAgainstAI) {
    unlockCardIfNew("AI Crusher", "Rare");
    awardEgg("common");
  }

  saveState();
  refreshRaceStatus();
  refreshCollection();
  refreshCup();
}

function refreshRaceStatus() {
  if (elements.race_status) {
    elements.race_status.textContent = `🏆 Best: ${state.bestDistance}m • ${state.raceBestMedal}`;
  }
}

// ===== Dino Quiz =====
function generateQuizQuestions() {
  const questions = [];
  const factKeys = Object.keys(dinoFacts).filter((k) => k !== "default");

  // Type 1: "Which dino…" questions from facts
  factKeys.forEach((key) => {
    const data = dinoFacts[key];
    data.facts.forEach((fact) => {
      const wrongAnswers = factKeys
        .filter((k) => k !== key)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((k) => dinoFacts[k].name);

      questions.push({
        question: `${fact.emoji} Which creature: "${fact.text}"`,
        correct: data.name,
        answers: shuffle([data.name, ...wrongAnswers]),
      });
    });
  });

  // Type 2: Period questions
  factKeys.forEach((key) => {
    const data = dinoFacts[key];
    const wrongPeriods = factKeys
      .filter((k) => k !== key && dinoFacts[k].period !== data.period)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((k) => dinoFacts[k].name);

    questions.push({
      question: `🕐 Which creature lived in the ${data.period.split("(")[0].trim()}?`,
      correct: data.name,
      answers: shuffle([data.name, ...wrongPeriods]),
    });
  });

  return shuffle(questions);
}

function startQuiz() {
  quizQuestions = generateQuizQuestions().slice(0, 10); // 10 questions per round
  quizIndex = 0;
  quizScore = 0;
  quizStreak = 0;
  quizActive = true;

  if (elements.start_quiz_btn) elements.start_quiz_btn.textContent = "🔄 Restart Quiz";
  showQuizQuestion();
}

function showQuizQuestion() {
  if (quizIndex >= quizQuestions.length) {
    endQuiz();
    return;
  }

  const q = quizQuestions[quizIndex];
  if (elements.quiz_question) elements.quiz_question.textContent = q.question;
  if (elements.quiz_feedback) elements.quiz_feedback.classList.add("hidden");
  if (elements.quiz_streak_display) elements.quiz_streak_display.textContent = `🔥 ${quizStreak}`;
  if (elements.quiz_score_display) elements.quiz_score_display.textContent = `⭐ ${quizScore}`;

  if (elements.quiz_answers) {
    elements.quiz_answers.innerHTML = "";
    q.answers.forEach((answer) => {
      const btn = document.createElement("button");
      btn.className = "quiz-answer-btn";
      btn.textContent = answer;
      btn.addEventListener("click", () => answerQuiz(answer, q.correct, btn));
      elements.quiz_answers.append(btn);
    });
  }
}

function answerQuiz(chosen, correct, btn) {
  if (!quizActive) return;

  // Disable all buttons
  elements.quiz_answers?.querySelectorAll(".quiz-answer-btn").forEach((b) => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
  });

  if (chosen === correct) {
    // Correct!
    btn.classList.add("correct");
    playSound("correct");
    quizStreak++;
    const points = 10 + quizStreak * 2; // Streak bonus
    quizScore += points;
    addXP(points, btn);
    spawnParticles(btn.getBoundingClientRect().left + 60, btn.getBoundingClientRect().top, 10, "#34d399");

    if (elements.quiz_feedback) {
      elements.quiz_feedback.textContent = quizStreak >= 3 ? `🔥 ${quizStreak} IN A ROW! +${points}` : `✅ Correct! +${points}`;
      elements.quiz_feedback.className = "quiz-feedback correct-feedback";
    }
  } else {
    btn.classList.add("wrong");
    playSound("wrong");
    shakeScreen();
    quizStreak = 0;

    if (elements.quiz_feedback) {
      elements.quiz_feedback.textContent = `❌ It was ${correct}!`;
      elements.quiz_feedback.className = "quiz-feedback wrong-feedback";
    }
  }

  if (elements.quiz_streak_display) elements.quiz_streak_display.textContent = `🔥 ${quizStreak}`;
  if (elements.quiz_score_display) elements.quiz_score_display.textContent = `⭐ ${quizScore}`;

  quizIndex++;
  setTimeout(() => showQuizQuestion(), 1500);
}

function endQuiz() {
  quizActive = false;

  if (elements.quiz_question) {
    elements.quiz_question.innerHTML = `
      <div style="font-size:2rem;margin-bottom:0.5rem">🎉</div>
      Quiz Complete!<br/>
      <strong>Score: ${quizScore}</strong>
    `;
  }
  if (elements.quiz_answers) elements.quiz_answers.innerHTML = "";
  if (elements.quiz_feedback) elements.quiz_feedback.classList.add("hidden");
  if (elements.start_quiz_btn) elements.start_quiz_btn.textContent = "🚀 Play Again!";

  // Awards
  const highScore = quizScore > (state.quizHighScore || 0);
  if (highScore) {
    state.quizHighScore = quizScore;
    unlockCardIfNew("Quiz Champion", "Epic");
  }

  if (quizStreak > (state.quizBestStreak || 0)) {
    state.quizBestStreak = quizStreak;
  }

  if (quizScore >= 50) {
    markCupStep("quiz_master", true);
    awardEgg("rare");
  }

  if (quizScore >= 30) awardEgg("common");

  saveState();
  refreshCup();
  refreshCollection();
  triggerConfetti(30);
  playSound("victory");
}

// ===== Mystery Egg System =====
function awardEgg(rarity) {
  if (!state.eggs) state.eggs = { common: 0, rare: 0, legendary: 0 };
  state.eggs[rarity] = (state.eggs[rarity] || 0) + 1;
  saveState();
  refreshEggInventory();

  // Notification
  const emojis = { common: "🥚", rare: "🪺", legendary: "✨🥚✨" };
  spawnFloatNumber(`${emojis[rarity]} +1 Egg!`, window.innerWidth / 2, 100);
}

function refreshEggInventory() {
  if (!state.eggs) state.eggs = { common: 0, rare: 0, legendary: 0 };
  if (elements.egg_common_count) elements.egg_common_count.textContent = state.eggs.common || 0;
  if (elements.egg_rare_count) elements.egg_rare_count.textContent = state.eggs.rare || 0;
  if (elements.egg_legendary_count) elements.egg_legendary_count.textContent = state.eggs.legendary || 0;
  refreshEggLog();
}

const hatchRewards = {
  common: [
    { emoji: "⭐", text: "15 XP!", action: (el) => addXP(15, el) },
    { emoji: "⭐", text: "20 XP!", action: (el) => addXP(20, el) },
    { emoji: "🃏", text: "Common Card!", action: () => unlockCardIfNew(`Egg Find #${Date.now() % 100}`, "Common") },
    { emoji: "🦴", text: "Bone Fragment!", action: (el) => addXP(10, el) },
    { emoji: "🪨", text: "Cool Rock!", action: (el) => addXP(12, el) },
  ],
  rare: [
    { emoji: "⭐", text: "40 XP!", action: (el) => addXP(40, el) },
    { emoji: "🃏", text: "Rare Card!", action: () => unlockCardIfNew(`Rare Hatch #${Date.now() % 100}`, "Rare") },
    { emoji: "🦕", text: "Baby Dino!", action: (el) => { addXP(35, el); unlockCardIfNew("Baby Dino", "Rare"); } },
    { emoji: "💎", text: "Crystal Fossil!", action: (el) => addXP(45, el) },
    { emoji: "🌟", text: "Star Bone! +50 XP", action: (el) => addXP(50, el) },
  ],
  legendary: [
    { emoji: "👑", text: "Golden Rex! +100 XP", action: (el) => { addXP(100, el); unlockCardIfNew("Golden Rex", "Legendary"); } },
    { emoji: "🌟", text: "Mega Star! +120 XP", action: (el) => addXP(120, el) },
    { emoji: "🏆", text: "Legendary Card!", action: () => unlockCardIfNew(`Legend #${Date.now() % 50}`, "Legendary") },
    { emoji: "🦖", text: "Alpha Rex! +80 XP", action: (el) => { addXP(80, el); unlockCardIfNew("Alpha Rex", "Legendary"); } },
    { emoji: "✨", text: "Cosmic Egg! +150 XP", action: (el) => addXP(150, el) },
  ],
};

function hatchEgg() {
  if (!state.eggs) state.eggs = { common: 0, rare: 0, legendary: 0 };

  // Find best available egg
  let rarity = null;
  if (state.eggs.legendary > 0) rarity = "legendary";
  else if (state.eggs.rare > 0) rarity = "rare";
  else if (state.eggs.common > 0) rarity = "common";

  if (!rarity) {
    if (elements.hatch_result) {
      elements.hatch_result.classList.remove("hidden");
      elements.hatch_result.innerHTML = `
        <div class="hatch-emoji">🤷</div>
        <div class="hatch-text">No eggs! Play games to earn them!</div>
      `;
    }
    return;
  }

  state.eggs[rarity]--;
  saveState();
  refreshEggInventory();

  // Pick random reward
  const rewards = hatchRewards[rarity];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  playSound("eggcrack");
  shakeScreen();
  triggerConfetti(rarity === "legendary" ? 60 : rarity === "rare" ? 30 : 15);

  // Show result
  if (elements.hatch_result) {
    elements.hatch_result.classList.remove("hidden");
    elements.hatch_result.innerHTML = `
      <div class="hatch-emoji">${reward.emoji}</div>
      <div class="hatch-text">${reward.text}</div>
      <div class="hatch-reward">${rarity.toUpperCase()} EGG</div>
    `;
  }

  // Execute reward
  setTimeout(() => {
    reward.action(elements.hatch_result);
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 20);

    // Log it
    if (!state.eggLog) state.eggLog = [];
    state.eggLog.unshift({
      rarity,
      reward: reward.text,
      emoji: reward.emoji,
      time: new Date().toLocaleTimeString(),
    });
    if (state.eggLog.length > 20) state.eggLog.length = 20;
    saveState();
    refreshEggLog();
    refreshCollection();
  }, 500);
}

function refreshEggLog() {
  if (!elements.egg_log || !state.eggLog) return;
  elements.egg_log.innerHTML = state.eggLog
    .slice(0, 10)
    .map(
      (e) =>
        `<div class="egg-log-item">${e.emoji} ${e.reward} <span style="color:var(--text-secondary);font-size:0.65rem">${e.rarity}</span></div>`
    )
    .join("");
}

// ===== Card Battle System =====
const BATTLE_EMOJIS = ["🦖", "🦕", "🦏", "🐊", "🦅", "🐉", "🦎", "🦂", "🐍", "🐻", "🦁", "🐘"];

const WILD_DINOS = [
  { name: "Wild Raptor", emoji: "🦖", tier: 1 },
  { name: "Cave Bear", emoji: "🐻", tier: 1 },
  { name: "Giant Croc", emoji: "🐊", tier: 1 },
  { name: "Wild Ptero", emoji: "🦅", tier: 2 },
  { name: "Rock Scorpio", emoji: "🦂", tier: 2 },
  { name: "Savage Rex", emoji: "🦖", tier: 2 },
  { name: "Ice Mammoth", emoji: "🐘", tier: 3 },
  { name: "Alpha Dragon", emoji: "🐉", tier: 3 },
  { name: "Mega Raptor", emoji: "🦎", tier: 3 },
  { name: "Titan Rex", emoji: "🦖", tier: 4 },
  { name: "Ancient Serpent", emoji: "🐍", tier: 4 },
  { name: "Sky Overlord", emoji: "🦅", tier: 4 },
];

// Generate stats for a card based on rarity
function getCardStats(card) {
  // Deterministic seed from card name
  let seed = 0;
  for (let i = 0; i < card.name.length; i++) seed += card.name.charCodeAt(i) * (i + 1);

  const rarityMult = { Common: 1, Rare: 1.4, Epic: 1.8, Legendary: 2.5 };
  const mult = rarityMult[card.rarity] || 1;

  const base = (stat) => Math.floor((8 + ((seed * stat) % 12)) * mult);
  return {
    atk: base(7),
    def: base(13),
    spd: base(19),
    maxHp: Math.floor(80 * mult + ((seed % 30) * mult)),
  };
}

// Generate wild dino stats based on tier
function getWildDinoStats(dino) {
  const tierMult = [0, 1, 1.3, 1.7, 2.2];
  const mult = tierMult[dino.tier] || 1;
  const rand = () => Math.floor((10 + Math.random() * 10) * mult);
  return {
    atk: rand(),
    def: rand(),
    spd: rand(),
    maxHp: Math.floor((90 + Math.random() * 30) * mult),
  };
}

function getCardEmoji(card) {
  // Pick a consistent emoji based on card name
  let idx = 0;
  for (let i = 0; i < card.name.length; i++) idx += card.name.charCodeAt(i);
  return BATTLE_EMOJIS[idx % BATTLE_EMOJIS.length];
}

// Battle state
let battleState = null;

function initBattle() {
  battleState = null;
  refreshBattleUI();
  refreshBattleRecord();
}

function selectBattleCard() {
  if (state.cards.length === 0) {
    addBattleLog("❌ No cards! Play games to earn some!", "");
    return;
  }

  // Cycle through cards or pick random
  const card = state.cards[Math.floor(Math.random() * state.cards.length)];
  const stats = getCardStats(card);
  const emoji = getCardEmoji(card);

  // Pick a wild dino opponent scaled to player level
  const maxTier = Math.min(Math.floor(state.level / 1.5) + 1, 4);
  const eligible = WILD_DINOS.filter((d) => d.tier <= maxTier);
  const wild = eligible[Math.floor(Math.random() * eligible.length)];
  const wildStats = getWildDinoStats(wild);

  battleState = {
    player: {
      name: card.name,
      emoji,
      rarity: card.rarity,
      ...stats,
      hp: stats.maxHp,
      specialUsed: false,
    },
    enemy: {
      name: wild.name,
      emoji: wild.emoji,
      tier: wild.tier,
      ...wildStats,
      hp: wildStats.maxHp,
      specialUsed: false,
    },
    turn: 0,
    active: true,
    log: [],
  };

  playSound("click");
  refreshBattleUI();
  addBattleLog(`⚔️ ${card.name} vs ${wild.name}! FIGHT!`, "critical");

  // Enable buttons
  if (elements.battle_attack_btn) elements.battle_attack_btn.disabled = false;
  if (elements.battle_special_btn) elements.battle_special_btn.disabled = false;
}

function performAttack(isSpecial) {
  if (!battleState || !battleState.active) return;
  battleState.turn++;

  const p = battleState.player;
  const e = battleState.enemy;

  // Player attacks first if faster (or coin flip if equal)
  const playerFirst = p.spd > e.spd || (p.spd === e.spd && Math.random() > 0.5);

  if (playerFirst) {
    doPlayerAttack(isSpecial);
    if (battleState.active) doEnemyAttack();
  } else {
    doEnemyAttack();
    if (battleState.active) doPlayerAttack(isSpecial);
  }

  refreshBattleUI();
}

function doPlayerAttack(isSpecial) {
  const p = battleState.player;
  const e = battleState.enemy;

  let dmg;
  let msg;

  if (isSpecial && !p.specialUsed) {
    p.specialUsed = true;
    if (elements.battle_special_btn) elements.battle_special_btn.disabled = true;
    // Special: 2× attack, ignores some defense
    dmg = Math.max(1, Math.floor(p.atk * 2 - e.def * 0.3 + Math.random() * 5));
    const crit = Math.random() < 0.3;
    if (crit) {
      dmg = Math.floor(dmg * 1.5);
      msg = `💥 ${p.name} CRITICAL SPECIAL! ${dmg} dmg!`;
      addBattleLog(msg, "critical");
      shakeScreen();
      triggerConfetti(10);
    } else {
      msg = `🌟 ${p.name} uses SPECIAL! ${dmg} dmg!`;
      addBattleLog(msg, "player-hit");
    }
    playSound("combo");
  } else {
    // Normal attack
    dmg = Math.max(1, Math.floor(p.atk - e.def * 0.5 + Math.random() * 6));
    const crit = Math.random() < 0.15;
    if (crit) {
      dmg = Math.floor(dmg * 1.5);
      msg = `💥 ${p.name} CRIT! ${dmg} dmg!`;
      addBattleLog(msg, "critical");
    } else {
      msg = `⚡ ${p.name} attacks! ${dmg} dmg`;
      addBattleLog(msg, "player-hit");
    }
    playSound("boost");
  }

  e.hp = Math.max(0, e.hp - dmg);

  // Animate
  const playerCard = document.getElementById("battle-player-card");
  const enemyCard = document.getElementById("battle-enemy-card");
  if (playerCard) {
    playerCard.classList.remove("attacking");
    void playerCard.offsetWidth;
    playerCard.classList.add("attacking");
    setTimeout(() => playerCard.classList.remove("attacking"), 400);
  }
  if (enemyCard && dmg > 0) {
    setTimeout(() => {
      enemyCard.classList.add("hit");
      setTimeout(() => enemyCard.classList.remove("hit"), 300);
    }, 200);
  }

  // Particles
  if (enemyCard) {
    const rect = enemyCard.getBoundingClientRect();
    spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 8, "#f87171");
  }

  if (e.hp <= 0) {
    endBattle(true);
  }
}

function doEnemyAttack() {
  const p = battleState.player;
  const e = battleState.enemy;

  // Enemy uses special ~20% chance after turn 2
  const useSpecial = !e.specialUsed && battleState.turn >= 2 && Math.random() < 0.2;
  let dmg;
  let msg;

  if (useSpecial) {
    e.specialUsed = true;
    dmg = Math.max(1, Math.floor(e.atk * 1.8 - p.def * 0.3 + Math.random() * 4));
    msg = `🔥 ${e.name} uses RAGE ATTACK! ${dmg} dmg!`;
    addBattleLog(msg, "enemy-hit");
    playSound("roar");
  } else {
    dmg = Math.max(1, Math.floor(e.atk - p.def * 0.5 + Math.random() * 5));
    const crit = Math.random() < 0.12;
    if (crit) {
      dmg = Math.floor(dmg * 1.5);
      msg = `💥 ${e.name} CRIT! ${dmg} dmg!`;
      addBattleLog(msg, "critical");
    } else {
      msg = `🦴 ${e.name} attacks! ${dmg} dmg`;
      addBattleLog(msg, "enemy-hit");
    }
    playSound("dig");
  }

  p.hp = Math.max(0, p.hp - dmg);

  // Animate enemy attack
  const enemyCard = document.getElementById("battle-enemy-card");
  const playerCard = document.getElementById("battle-player-card");
  if (enemyCard) {
    enemyCard.classList.remove("attacking");
    void enemyCard.offsetWidth;
    enemyCard.classList.add("attacking");
    setTimeout(() => enemyCard.classList.remove("attacking"), 400);
  }
  if (playerCard && dmg > 0) {
    setTimeout(() => {
      playerCard.classList.add("hit");
      setTimeout(() => playerCard.classList.remove("hit"), 300);
    }, 200);
  }

  if (p.hp <= 0) {
    endBattle(false);
  }
}

function endBattle(won) {
  battleState.active = false;
  if (elements.battle_attack_btn) elements.battle_attack_btn.disabled = true;
  if (elements.battle_special_btn) elements.battle_special_btn.disabled = true;

  // Track wins/losses
  if (!state.battleWins) state.battleWins = 0;
  if (!state.battleLosses) state.battleLosses = 0;
  if (!state.battleStreak) state.battleStreak = 0;

  if (won) {
    state.battleWins++;
    state.battleStreak++;
    const tierBonus = (battleState.enemy.tier || 1) * 10;
    addXP(30 + tierBonus, elements.battle_result);
    addBattleLog(`🏆 YOU WIN! +${30 + tierBonus} XP!`, "victory");
    triggerConfetti(40);
    playVictoryFanfare();
    shakeScreen();

    // Rewards
    if (state.battleStreak >= 3) awardEgg("rare");
    else awardEgg("common");

    if (state.battleWins >= 5) unlockCardIfNew("Battle Veteran", "Rare");
    if (state.battleWins >= 15) unlockCardIfNew("Battle Master", "Epic");
    if (state.battleStreak >= 5) unlockCardIfNew("Unstoppable!", "Legendary");

    const defeatedCard = document.getElementById("battle-enemy-card");
    if (defeatedCard) defeatedCard.classList.add("defeated");

    // Show result
    if (elements.battle_result) {
      elements.battle_result.className = "battle-result win";
      elements.battle_result.textContent = `🏆 Victory! ${battleState.player.name} wins in ${battleState.turn} turns!`;
      elements.battle_result.classList.remove("hidden");
    }
  } else {
    state.battleLosses++;
    state.battleStreak = 0;
    addXP(5, elements.battle_result);
    addBattleLog(`💀 Defeated! Better luck next time!`, "defeat");
    playSound("wrong");

    const defeatedCard = document.getElementById("battle-player-card");
    if (defeatedCard) defeatedCard.classList.add("defeated");

    if (elements.battle_result) {
      elements.battle_result.className = "battle-result lose";
      elements.battle_result.textContent = `💀 Defeated by ${battleState.enemy.name}! Try again!`;
      elements.battle_result.classList.remove("hidden");
    }
  }

  saveState();
  refreshBattleRecord();
  refreshCollection();
}

function addBattleLog(text, className) {
  if (!elements.battle_log) return;
  const entry = document.createElement("div");
  entry.className = `battle-log-entry ${className || ""}`;
  entry.textContent = text;
  elements.battle_log.appendChild(entry);
  elements.battle_log.scrollTop = elements.battle_log.scrollHeight;
}

function renderStatBar(label, value, className) {
  return `<div class="battle-stat">
    <span class="battle-stat-label">${label}</span>
    <span class="battle-stat-val ${className}">${value}</span>
  </div>`;
}

function refreshBattleUI() {
  if (!battleState) {
    // Default state
    if (elements.battle_player_emoji) elements.battle_player_emoji.textContent = "❓";
    if (elements.battle_player_name) elements.battle_player_name.textContent = "Pick a card!";
    if (elements.battle_player_stats) elements.battle_player_stats.innerHTML = "";
    if (elements.battle_player_hp) elements.battle_player_hp.style.width = "100%";
    if (elements.battle_player_hp_label) elements.battle_player_hp_label.textContent = "-- HP";
    if (elements.battle_enemy_emoji) elements.battle_enemy_emoji.textContent = "❓";
    if (elements.battle_enemy_name) elements.battle_enemy_name.textContent = "???";
    if (elements.battle_enemy_stats) elements.battle_enemy_stats.innerHTML = "";
    if (elements.battle_enemy_hp) elements.battle_enemy_hp.style.width = "100%";
    if (elements.battle_enemy_hp_label) elements.battle_enemy_hp_label.textContent = "-- HP";
    if (elements.battle_log) elements.battle_log.innerHTML = '<div class="battle-log-entry">Pick a card to start battling!</div>';
    if (elements.battle_result) elements.battle_result.classList.add("hidden");
    return;
  }

  const p = battleState.player;
  const e = battleState.enemy;

  // Player card
  if (elements.battle_player_emoji) elements.battle_player_emoji.textContent = p.emoji;
  if (elements.battle_player_name) elements.battle_player_name.textContent = p.name;
  if (elements.battle_player_stats) {
    elements.battle_player_stats.innerHTML =
      renderStatBar("ATK", p.atk, "stat-atk") +
      renderStatBar("DEF", p.def, "stat-def") +
      renderStatBar("SPD", p.spd, "stat-spd");
  }
  const pHpPct = Math.max(0, (p.hp / p.maxHp) * 100);
  if (elements.battle_player_hp) elements.battle_player_hp.style.width = `${pHpPct}%`;
  if (elements.battle_player_hp_label) elements.battle_player_hp_label.textContent = `${p.hp} HP`;

  // Enemy card
  if (elements.battle_enemy_emoji) elements.battle_enemy_emoji.textContent = e.emoji;
  if (elements.battle_enemy_name) elements.battle_enemy_name.textContent = e.name;
  if (elements.battle_enemy_stats) {
    elements.battle_enemy_stats.innerHTML =
      renderStatBar("ATK", e.atk, "stat-atk") +
      renderStatBar("DEF", e.def, "stat-def") +
      renderStatBar("SPD", e.spd, "stat-spd");
  }
  const eHpPct = Math.max(0, (e.hp / e.maxHp) * 100);
  if (elements.battle_enemy_hp) elements.battle_enemy_hp.style.width = `${eHpPct}%`;
  if (elements.battle_enemy_hp_label) elements.battle_enemy_hp_label.textContent = `${e.hp} HP`;
}

function refreshBattleRecord() {
  if (!elements.battle_record) return;
  const w = state.battleWins || 0;
  const l = state.battleLosses || 0;
  const s = state.battleStreak || 0;
  elements.battle_record.textContent = `⚔️ ${w}W / ${l}L • 🔥 Streak: ${s}`;
}

// ===== Collection =====
function unlockCardIfNew(name, rarity) {
  if (state.cards.some((c) => c.name === name)) return;
  state.cards.push({
    name,
    rarity,
    unlockedAt: new Date().toISOString(),
    imageId: getRandomAssetId(),
  });
  playSound("fossil");
  saveState();
}

function refreshCollection() {
  if (!elements.card_list) return;
  elements.card_list.innerHTML = "";

  if (state.cards.length === 0) {
    elements.card_list.innerHTML = '<div class="dino-card common"><div class="card-name">Play to unlock!</div></div>';
  } else {
    state.cards
      .slice()
      .reverse()
      .forEach((card) => {
        const asset = getAssetById(card.imageId);
        const imgSrc = asset?.formats?.web || "assets/web/trilobite-ordovicien-8127-jpg.jpg";
        const rarityClass = card.rarity.toLowerCase();
        const div = document.createElement("div");
        div.className = `dino-card ${rarityClass}`;
        div.innerHTML = `
        <img src="${imgSrc}" alt="${card.name}" />
        <div class="card-name">${card.name}</div>
        <div class="card-rarity">${card.rarity}</div>
      `;
        elements.card_list.append(div);
      });
  }

  if (elements.collection_summary) {
    elements.collection_summary.textContent = `🃏 ${state.cards.length} Cards collected`;
  }
}

// ===== Cup =====
function refreshCup() {
  const challenges = [
    { id: "create_dino", label: "Discover 5 dinosaurs" },
    { id: "fossil_set", label: "Complete a fossil set" },
    { id: "race_medal", label: "Earn Silver or Gold medal" },
    { id: "make_poster", label: "Create a victory poster" },
    { id: "quiz_master", label: "Score 50+ in quiz" },
  ];

  if (!elements.cup_list) return;
  elements.cup_list.innerHTML = "";

  let done = 0;
  challenges.forEach((c) => {
    const complete = Boolean(state.cupProgress[c.id]);
    if (complete) done++;
    const li = document.createElement("li");
    li.className = complete ? "completed" : "";
    li.innerHTML = `<span>${complete ? "✅" : "⬜"}</span> ${c.label}`;
    elements.cup_list.append(li);
  });

  // Progress bar
  if (elements.cup_fill) {
    elements.cup_fill.style.width = `${(done / challenges.length) * 100}%`;
  }

  if (done === challenges.length) {
    if (elements.cup_status) elements.cup_status.textContent = "🏆 Dino Cup Complete! Trophy unlocked!";
    unlockCardIfNew("Dino Cup Trophy", "Legendary");
    awardEgg("legendary");
    saveState();
    refreshCollection();
  } else {
    if (elements.cup_status) elements.cup_status.textContent = `${done}/${challenges.length} completed`;
  }
}

function markCupStep(id, val) {
  state.cupProgress[id] = val;
}

// ===== Poster =====
function renderPoster() {
  const canvas = elements.poster_canvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#1e3a5f");
  grad.addColorStop(0.5, "#0f172a");
  grad.addColorStop(1, "#1a1a2e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dino image overlay
  const dinoAsset = assetManifest.assets.find((a) => a.category === "dinosaur-reconstruction");
  if (dinoAsset) {
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = 0.25;
      ctx.drawImage(img, canvas.width - 380, 80, 340, 340);
      ctx.globalAlpha = 1.0;
      drawPosterText(ctx, canvas);
    };
    img.onerror = () => drawPosterText(ctx, canvas);
    img.src = dinoAsset.formats.web;
  } else {
    drawPosterText(ctx, canvas);
  }
}

function drawPosterText(ctx, canvas) {
  const player = elements.poster_player?.value.trim() || "Champion";
  const level = LEVEL_TITLES[state.level] || LEVEL_TITLES[0];

  // Title
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 52px 'Segoe UI', sans-serif";
  ctx.fillText("🦖 DINO CHAMPION! 🦕", 40, 80);

  // Player info
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 40px 'Segoe UI', sans-serif";
  ctx.fillText(player, 40, 180);

  ctx.fillStyle = "#34d399";
  ctx.font = "32px 'Segoe UI', sans-serif";
  ctx.fillText(`${level.emoji} Level: ${level.name}`, 40, 240);
  ctx.fillText(`⭐ XP: ${state.xp}`, 40, 290);
  ctx.fillText(`🃏 Cards: ${state.cards.length}`, 40, 340);
  ctx.fillText(`🏆 Best Race: ${state.bestDistance}m`, 40, 390);

  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 28px 'Segoe UI', sans-serif";
  ctx.fillText("🏆 Champion of DinoLab! 🏆", 40, 460);

  ctx.fillStyle = "#64748b";
  ctx.font = "18px 'Segoe UI', sans-serif";
  ctx.fillText("DinoLab Mashup • Made for young paleontologists", 40, 510);

  if (elements.download_poster) {
    elements.download_poster.href = canvas.toDataURL("image/png");
  }
}

// ===== Quest =====
function ensureDailyQuest() {
  const today = getToday();
  if (state.dailyQuestDate === today && state.dailyQuest) return;
  state.dailyQuestDate = today;
  state.dailyQuest = dailyQuestPool[Math.floor(Math.random() * dailyQuestPool.length)];
  saveState();
}

function completeDailyQuest() {
  const today = getToday();
  if (state.lastQuestCompleteDate === today) {
    if (elements.streak_status) elements.streak_status.textContent = state.streak;
    return;
  }

  const yesterday = getRelativeDay(-1);
  state.streak = state.lastQuestCompleteDate === yesterday ? state.streak + 1 : 1;
  state.lastQuestCompleteDate = today;

  unlockCardIfNew(`Streak-${state.streak}`, state.streak >= 7 ? "Epic" : "Common");
  addXP(25 + state.streak * 5, elements.complete_quest_btn);
  awardEgg(state.streak >= 5 ? "rare" : "common");

  saveState();
  refreshQuest();
  refreshCollection();
  triggerConfetti(15);
  playSound("victory");
}

function refreshQuest() {
  if (elements.daily_quest) elements.daily_quest.textContent = `📜 ${state.dailyQuest}`;
  if (elements.streak_status) elements.streak_status.textContent = state.streak;
}

// ===== Parent Controls =====
function setParentPin() {
  const pin = elements.parent_pin?.value.trim();
  if (!/^\d{4,6}$/.test(pin)) {
    if (elements.parent_status) elements.parent_status.textContent = "PIN must be 4-6 digits";
    return;
  }
  state.parent.pin = pin;
  saveState();
  if (elements.parent_status) elements.parent_status.textContent = "✅ PIN saved";
}

function toggleParentLock() {
  if (!state.parent.pin) {
    if (elements.parent_status) elements.parent_status.textContent = "Set a PIN first";
    return;
  }
  state.parent.locked = !state.parent.locked;
  saveState();
  refreshLockState();
}

function unlockParent() {
  if (elements.unlock_pin?.value.trim() === state.parent.pin) {
    state.parent.locked = false;
    saveState();
    refreshLockState();
    if (elements.parent_status) elements.parent_status.textContent = "🔓 Unlocked";
  } else {
    if (elements.parent_status) elements.parent_status.textContent = "❌ Wrong PIN";
  }
}

function refreshLockState() {
  const locked = Boolean(state.parent.locked);
  if (elements.parent_status) {
    elements.parent_status.textContent = locked ? "🔒 Locked" : "🔓 Unlocked";
  }
}

// ===== Utilities =====
function getRandomAssetId() {
  if (assetManifest.assets.length === 0) return null;
  return assetManifest.assets[Math.floor(Math.random() * assetManifest.assets.length)].id;
}

function getAssetById(id) {
  return assetManifest.assets.find((a) => a.id === id);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initialState);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(initialState),
      ...parsed,
      parent: { ...initialState.parent, ...(parsed.parent || {}) },
      eggs: { ...initialState.eggs, ...(parsed.eggs || {}) },
    };
  } catch {
    return structuredClone(initialState);
  }
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getRelativeDay(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
