const STORAGE_KEY = "dinolab-state-v1";

// ===== Sound Effects System =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true;

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    switch(type) {
      case 'click':
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialDecayTo = 0.01;
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
        break;
      case 'dig':
        osc.type = 'triangle';
        osc.frequency.value = 200;
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
        break;
      case 'fossil':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
        break;
      case 'victory':
        playVictoryFanfare();
        return;
      case 'roar':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
        break;
      case 'boost':
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
        break;
    }
  } catch(e) { /* Audio not supported */ }
}

function playVictoryFanfare() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }, i * 150);
  });
}

const fossilSets = {
  Desert: ["Raptor Claw", "Tooth Fragment", "Ancient Egg"],
  Volcano: ["Lava Bone", "Ash Skull", "Fire Crest"],
  IceAge: ["Frozen Rib", "Mammoth Tusk", "Frost Paw"]
};

const dailyQuestPool = [
  "Save one new dino",
  "Find one complete fossil set",
  "Earn at least a Silver race medal",
  "Generate one victory poster"
];

const initialState = {
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
  parent: { pin: "", locked: false }
};

let state = loadState();
let assetManifest = { assets: [] };
let activeHunt = [];
let foundInHunt = new Set();
let raceIntervalId = null;
let raceMsLeft = 0;
let raceDistance = 0;

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  loadAssetManifest().then(() => {
    setupFossilSetOptions();
    attachEventListeners();
    ensureDailyQuest();
    startNewHunt();
    refreshAll();
    renderPoster();
    renderGallery();
    registerServiceWorker();
  });
});

function cacheElements() {
  const ids = [
    "head-part", "tail-part", "skin-part", "roar-range", "speed-range", "armor-range",
    "roar-value", "speed-value", "armor-value", "random-name-btn", "dino-name",
    "save-dino-btn", "lab-preview", "saved-dinos", "fossil-set", "new-hunt-btn",
    "dig-grid", "fossil-status", "start-race-btn", "boost-btn", "race-status",
    "race-timer", "card-list", "collection-summary", "cup-list", "cup-status",
    "poster-player", "poster-score", "make-poster-btn", "download-poster", "poster-canvas",
    "daily-quest", "complete-quest-btn", "streak-status", "parent-pin", "set-pin-btn",
    "toggle-lock-btn", "unlock-pin", "unlock-btn", "parent-status", "gallery-scroll",
    "dino-preview-img", "preview-placeholder", "racer", "confetti-container", "sound-toggle"
  ];
  ids.forEach(id => {
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

function setupFossilSetOptions() {
  Object.keys(fossilSets).forEach(setName => {
    const opt = document.createElement("option");
    opt.value = setName;
    opt.textContent = `🗺️ ${setName}`;
    elements.fossil_set?.append(opt);
  });
}

function attachEventListeners() {
  [elements.roar_range, elements.speed_range, elements.armor_range].forEach(el => {
    el?.addEventListener("input", refreshLabPreview);
  });
  [elements.head_part, elements.tail_part, elements.skin_part].forEach(el => {
    el?.addEventListener("change", refreshLabPreview);
  });

  elements.random_name_btn?.addEventListener("click", () => {
    if (elements.dino_name) elements.dino_name.value = createRandomName();
    refreshLabPreview();
  });

  elements.save_dino_btn?.addEventListener("click", saveDino);
  elements.new_hunt_btn?.addEventListener("click", startNewHunt);
  elements.start_race_btn?.addEventListener("click", startRace);
  elements.boost_btn?.addEventListener("click", boostRacer);
  elements.make_poster_btn?.addEventListener("click", () => {
    renderPoster();
    markCupStep("make_poster", true);
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
    if (elements.sound_toggle) {
      elements.sound_toggle.textContent = soundEnabled ? "🔊" : "🔇";
    }
    if (soundEnabled) playSound('click');
  });
}

function refreshAll() {
  refreshLabPreview();
  refreshSavedDinos();
  refreshCollection();
  refreshRaceStatus();
  refreshCup();
  refreshQuest();
  refreshLockState();
}

// ===== Gallery =====
function renderGallery() {
  if (!elements.gallery_scroll) return;
  elements.gallery_scroll.innerHTML = "";
  
  // Show all images, shuffled for variety
  const shuffled = [...assetManifest.assets].sort(() => Math.random() - 0.5);
  shuffled.forEach(asset => {
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.innerHTML = `
      <img src="${asset.formats.web}" alt="${asset.altText}" loading="lazy" />
      <div class="caption">${asset.subject}</div>
    `;
    div.addEventListener("click", () => playSound('click'));
    elements.gallery_scroll.append(div);
  });
}

// ===== Lab =====
function refreshLabPreview() {
  if (elements.roar_value) elements.roar_value.textContent = elements.roar_range?.value || 5;
  if (elements.speed_value) elements.speed_value.textContent = elements.speed_range?.value || 5;
  if (elements.armor_value) elements.armor_value.textContent = elements.armor_range?.value || 5;

  const name = elements.dino_name?.value.trim() || "Unnamed Dino";
  const head = elements.head_part?.value || "Horned";
  const tail = elements.tail_part?.value || "Club";
  const skin = elements.skin_part?.value || "Forest";

  if (elements.lab_preview) {
    elements.lab_preview.textContent = `${name} • ${head} head • ${tail} tail • ${skin} skin`;
  }

  // Show random dino image in preview
  const dinoAssets = assetManifest.assets.filter(a => 
    a.category === "dinosaur-reconstruction" || a.title.toLowerCase().includes("skeleton")
  );
  if (dinoAssets.length > 0 && elements.dino_preview_img) {
    const randomAsset = dinoAssets[Math.floor(Math.random() * dinoAssets.length)];
    elements.dino_preview_img.src = randomAsset.formats.web;
    elements.dino_preview_img.classList.remove("hidden");
    if (elements.preview_placeholder) elements.preview_placeholder.style.display = "none";
  }
}

function saveDino() {
  if (isLocked()) return;
  
  playSound('roar');
  
  const newDino = {
    name: elements.dino_name?.value.trim() || createRandomName(),
    head: elements.head_part?.value || "Horned",
    tail: elements.tail_part?.value || "Club",
    skin: elements.skin_part?.value || "Forest",
    roar: Number(elements.roar_range?.value || 5),
    speed: Number(elements.speed_range?.value || 5),
    armor: Number(elements.armor_range?.value || 7),
    imageId: getRandomAssetId()
  };
  
  state.dinos.push(newDino);
  unlockCardIfNew(`Creator-${newDino.name}`, "Rare");
  markCupStep("create_dino", true);
  saveState();
  refreshAll();
  triggerConfetti(15);
}

function refreshSavedDinos() {
  if (!elements.saved_dinos) return;
  elements.saved_dinos.innerHTML = "";
  
  if (state.dinos.length === 0) {
    elements.saved_dinos.innerHTML = '<div class="saved-dino-card"><div class="dino-name">No dinos yet!</div></div>';
    return;
  }

  state.dinos.slice(-6).reverse().forEach(dino => {
    const asset = getAssetById(dino.imageId);
    const imgSrc = asset?.formats.web || "assets/web/diplodocus-heinrich-harder-jpg.jpg";
    
    const card = document.createElement("div");
    card.className = "saved-dino-card";
    card.innerHTML = `
      <img src="${imgSrc}" alt="${dino.name}" />
      <div class="dino-name">${dino.name}</div>
      <div class="dino-stats">S${dino.speed} A${dino.armor} R${dino.roar}</div>
    `;
    elements.saved_dinos.append(card);
  });
}

// ===== Fossil Hunt =====
function startNewHunt() {
  const setName = elements.fossil_set?.value || "Desert";
  const fossils = fossilSets[setName];
  foundInHunt = new Set();

  // Mix fossils with decoys
  const pool = [...fossils, ...fossils, "Mud", "Rock", "Sand", "Amber", "Leaf", "Shell"];
  activeHunt = pool.sort(() => Math.random() - 0.5).slice(0, 12);

  if (!elements.dig_grid) return;
  elements.dig_grid.innerHTML = "";

  // Get fossil images
  const fossilAssets = assetManifest.assets.filter(a => 
    a.category === "fossil-photo" || a.title.toLowerCase().includes("fossil")
  );

  activeHunt.forEach((item, idx) => {
    const btn = document.createElement("button");
    btn.className = "dig-tile";
    btn.textContent = "🪨 Dig!";
    btn.dataset.item = item;
    btn.dataset.idx = idx;
    
    // Assign a random fossil image for real fossils
    if (fossils.includes(item) && fossilAssets.length > 0) {
      btn.dataset.imgSrc = fossilAssets[idx % fossilAssets.length].formats.web;
    }
    
    btn.addEventListener("click", () => revealDigTile(btn, item, setName));
    elements.dig_grid.append(btn);
  });
  
  updateFossilStatus(setName);
}

function revealDigTile(button, item, setName) {
  if (button.disabled) return;
  button.disabled = true;
  
  playSound('dig');
  
  const fossils = fossilSets[setName];
  const isFossil = fossils.includes(item);
  
  button.classList.add("revealed");
  
  if (isFossil && button.dataset.imgSrc) {
    button.innerHTML = `<img src="${button.dataset.imgSrc}" alt="${item}" />`;
    button.classList.add("found-fossil");
    foundInHunt.add(item);
    playSound('fossil');
  } else {
    button.textContent = isFossil ? `🦴 ${item}` : `💨 ${item}`;
    if (isFossil) {
      button.classList.add("found-fossil");
      foundInHunt.add(item);
      playSound('fossil');
    }
  }

  updateFossilStatus(setName);

  const complete = fossils.every(f => foundInHunt.has(f));
  if (complete) {
    if (!state.completedFossilSets.includes(setName)) {
      state.completedFossilSets.push(setName);
      unlockCardIfNew(`Fossil-${setName}`, "Epic");
    }
    markCupStep("fossil_set", true);
    saveState();
    refreshCollection();
    refreshCup();
    if (elements.fossil_status) {
      elements.fossil_status.textContent = `🎉 Set complete: ${setName}! Card unlocked!`;
    }
    triggerConfetti(30);
    playSound('victory');
  }
}

function updateFossilStatus(setName) {
  const total = fossilSets[setName].length;
  if (elements.fossil_status) {
    elements.fossil_status.textContent = `Found ${foundInHunt.size}/${total} fossils in ${setName}`;
  }
}

// ===== Racing =====
function startRace() {
  if (raceIntervalId) return;
  
  raceMsLeft = 10000;
  raceDistance = 0;
  
  if (elements.boost_btn) elements.boost_btn.disabled = false;
  if (elements.start_race_btn) elements.start_race_btn.disabled = true;
  if (elements.race_timer) elements.race_timer.textContent = "⏱️ 10.0s";
  if (elements.racer) elements.racer.style.left = "5%";

  raceIntervalId = setInterval(() => {
    raceMsLeft -= 100;
    if (elements.race_timer) {
      elements.race_timer.textContent = `⏱️ ${(raceMsLeft / 1000).toFixed(1)}s`;
    }
    if (raceMsLeft <= 0) finishRace();
  }, 100);
}

function boostRacer() {
  playSound('boost');
  
  const speedBonus = Number(elements.speed_range?.value || 5) * 0.5;
  raceDistance += 3 + speedBonus;
  
  // Move racer visually
  const progress = Math.min(raceDistance / 150, 1);
  if (elements.racer) {
    elements.racer.style.left = `${5 + progress * 80}%`;
  }
  
  if (elements.race_status) {
    elements.race_status.textContent = `Distance: ${Math.floor(raceDistance)}m`;
  }
}

function finishRace() {
  clearInterval(raceIntervalId);
  raceIntervalId = null;
  
  if (elements.boost_btn) elements.boost_btn.disabled = true;
  if (elements.start_race_btn) elements.start_race_btn.disabled = false;

  const distance = Math.floor(raceDistance);
  const medal = distance >= 150 ? "Gold" : distance >= 100 ? "Silver" : distance >= 60 ? "Bronze" : "None";
  
  if (elements.race_timer) {
    const emoji = { Gold: "🥇", Silver: "🥈", Bronze: "🥉", None: "😅" }[medal];
    elements.race_timer.textContent = `${emoji} ${distance}m - ${medal}!`;
  }

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
    triggerConfetti(medal === "Gold" ? 40 : 20);
    playSound('victory');
  }

  saveState();
  refreshRaceStatus();
  refreshCollection();
  refreshCup();
}

function refreshRaceStatus() {
  if (elements.race_status) {
    elements.race_status.textContent = `🏆 Best: ${state.bestDistance}m • Medal: ${state.raceBestMedal}`;
  }
}

// ===== Collection =====
function unlockCardIfNew(name, rarity) {
  if (state.cards.some(c => c.name === name)) return;
  state.cards.push({ 
    name, 
    rarity, 
    unlockedAt: new Date().toISOString(),
    imageId: getRandomAssetId()
  });
}

function refreshCollection() {
  if (!elements.card_list) return;
  elements.card_list.innerHTML = "";
  
  if (state.cards.length === 0) {
    elements.card_list.innerHTML = '<div class="dino-card common"><div class="card-name">Play to unlock cards!</div></div>';
  } else {
    state.cards.slice().reverse().forEach(card => {
      const asset = getAssetById(card.imageId);
      const imgSrc = asset?.formats.web || "assets/web/trilobite-ordovicien-8127-jpg.jpg";
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
    elements.collection_summary.textContent = `🃏 Cards: ${state.cards.length}`;
  }
}

// ===== Cup =====
function refreshCup() {
  const challenges = [
    { id: "create_dino", label: "Build and save a custom dino" },
    { id: "fossil_set", label: "Complete a fossil set" },
    { id: "race_medal", label: "Earn Silver or Gold medal" },
    { id: "make_poster", label: "Generate a victory poster" }
  ];

  if (!elements.cup_list) return;
  elements.cup_list.innerHTML = "";
  
  let done = 0;
  challenges.forEach(c => {
    const complete = Boolean(state.cupProgress[c.id]);
    if (complete) done++;
    
    const li = document.createElement("li");
    li.className = complete ? "completed" : "";
    li.innerHTML = `<span>${complete ? "✅" : "⬜"}</span> ${c.label}`;
    elements.cup_list.append(li);
  });

  if (done === challenges.length) {
    if (elements.cup_status) elements.cup_status.textContent = "🏆 Dino Cup Complete! Trophy unlocked!";
    unlockCardIfNew("Weekly Dino Cup Trophy", "Legendary");
    saveState();
    refreshCollection();
  } else {
    if (elements.cup_status) elements.cup_status.textContent = `Progress: ${done}/${challenges.length}`;
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

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#1e3a5f");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Try to draw a dino image
  const dinoAsset = assetManifest.assets.find(a => a.category === "dinosaur-reconstruction");
  if (dinoAsset) {
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = 0.3;
      ctx.drawImage(img, canvas.width - 350, 100, 300, 300);
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
  // Title
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 52px 'Segoe UI', sans-serif";
  ctx.fillText("🦖 DINO VICTORY! 🦕", 40, 80);

  const player = elements.poster_player?.value.trim() || "Champion";
  const score = Number(elements.poster_score?.value || 100);
  const dinoName = state.dinos[state.dinos.length - 1]?.name || "Rookie Raptor";

  ctx.fillStyle = "#f1f5f9";
  ctx.font = "36px 'Segoe UI', sans-serif";
  ctx.fillText(`Player: ${player}`, 40, 180);
  ctx.fillText(`Score: ${score}`, 40, 240);
  ctx.fillText(`Dino: ${dinoName}`, 40, 300);

  ctx.fillStyle = "#34d399";
  ctx.font = "28px 'Segoe UI', sans-serif";
  ctx.fillText("🏆 Champion of the Prehistoric Cup! 🏆", 40, 400);

  ctx.fillStyle = "#64748b";
  ctx.font = "18px 'Segoe UI', sans-serif";
  ctx.fillText("DinoLab Mashup • Made for young paleontologists", 40, 500);

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
  state.streak = (state.lastQuestCompleteDate === yesterday) ? state.streak + 1 : 1;
  state.lastQuestCompleteDate = today;
  
  unlockCardIfNew(`Streak-${state.streak}`, state.streak >= 7 ? "Epic" : "Common");
  saveState();
  refreshQuest();
  refreshCollection();
  triggerConfetti(10);
}

function refreshQuest() {
  if (elements.daily_quest) {
    elements.daily_quest.textContent = `📜 ${state.dailyQuest}`;
  }
  if (elements.streak_status) {
    elements.streak_status.textContent = state.streak;
  }
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
  const locked = isLocked();
  if (elements.parent_status) {
    elements.parent_status.textContent = locked ? "🔒 Locked" : "🔓 Unlocked";
  }
  if (elements.save_dino_btn) elements.save_dino_btn.disabled = locked;
}

function isLocked() {
  return Boolean(state.parent.locked);
}

// ===== Confetti =====
function triggerConfetti(count = 20) {
  const container = elements.confetti_container;
  if (!container) return;
  
  const colors = ["#fbbf24", "#34d399", "#38bdf8", "#f87171", "#a78bfa", "#f472b6"];
  
  for (let i = 0; i < count; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.append(confetti);
    
    setTimeout(() => confetti.remove(), 3500);
  }
}

// ===== Utilities =====
function getRandomAssetId() {
  if (assetManifest.assets.length === 0) return null;
  return assetManifest.assets[Math.floor(Math.random() * assetManifest.assets.length)].id;
}

function getAssetById(id) {
  return assetManifest.assets.find(a => a.id === id);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initialState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(initialState), ...parsed, parent: { ...initialState.parent, ...(parsed.parent || {}) } };
  } catch {
    return structuredClone(initialState);
  }
}

function createRandomName() {
  const first = ["Turbo", "Mega", "Chompy", "Stomp", "Rumble", "Nova", "Thunder", "Blaze", "Shadow", "Storm"];
  const second = ["Rex", "Claw", "Horn", "Tail", "Roar", "Spike", "Fang", "Scale", "Wing", "Bone"];
  return `${first[Math.floor(Math.random() * first.length)]}${second[Math.floor(Math.random() * second.length)]}`;
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
