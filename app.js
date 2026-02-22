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
  "Discover 3 different dinosaurs",
  "Find one complete fossil set",
  "Earn at least a Silver race medal",
  "Generate one victory poster",
  "Learn fun facts about a T-Rex",
  "Explore the prehistoric gallery"
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
    renderDiscoveryGallery();
    registerServiceWorker();
  });
});

function cacheElements() {
  const ids = [
    "fossil-set", "new-hunt-btn", "dig-grid", "fossil-status", 
    "start-race-btn", "boost-btn", "race-status", "race-timer", 
    "card-list", "collection-summary", "cup-list", "cup-status",
    "poster-player", "poster-score", "make-poster-btn", "download-poster", "poster-canvas",
    "daily-quest", "complete-quest-btn", "streak-status", "parent-pin", "set-pin-btn",
    "toggle-lock-btn", "unlock-pin", "unlock-btn", "parent-status", "gallery-scroll",
    "racer", "confetti-container", "sound-toggle",
    "discovery-grid", "dino-modal", "modal-close", "modal-img", 
    "modal-title", "modal-period", "modal-facts", "modal-next"
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
  
  // Modal controls
  elements.modal_close?.addEventListener("click", closeModal);
  elements.modal_next?.addEventListener("click", showRandomDino);
  elements.dino_modal?.addEventListener("click", (e) => {
    if (e.target === elements.dino_modal) closeModal();
  });
}

function refreshAll() {
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
    div.addEventListener("click", () => openDinoModal(asset));
    elements.gallery_scroll.append(div);
  });
}

// ===== Dino Discovery Gallery with Fun Facts =====
const dinoFacts = {
  "tyrannosaurus": {
    name: "Tyrannosaurus Rex",
    period: "Late Cretaceous (68-66 million years ago)",
    facts: [
      { emoji: "👑", text: "T-Rex means 'Tyrant Lizard King' - the most famous dinosaur ever!" },
      { emoji: "🦷", text: "Had 60 huge teeth, some as long as bananas!" },
      { emoji: "🏃", text: "Could run about 12 mph - faster than most humans!" },
      { emoji: "👃", text: "Had an amazing sense of smell to find food from miles away" }
    ]
  },
  "triceratops": {
    name: "Triceratops",
    period: "Late Cretaceous (68-66 million years ago)",
    facts: [
      { emoji: "🦏", text: "Name means 'Three-Horned Face' - it had 3 horns!" },
      { emoji: "🛡️", text: "The frill on its head was made of solid bone for protection" },
      { emoji: "🌿", text: "Was a plant-eater with a beak like a parrot" },
      { emoji: "📏", text: "Grew up to 30 feet long - as big as a school bus!" }
    ]
  },
  "stegosaurus": {
    name: "Stegosaurus",
    period: "Late Jurassic (155-150 million years ago)",
    facts: [
      { emoji: "🔺", text: "Had 17 bony plates along its back that may have helped control body temperature" },
      { emoji: "⚔️", text: "Its tail had 4 sharp spikes called a 'thagomizer' for defense" },
      { emoji: "🧠", text: "Had a brain the size of a walnut - tiny for such a big animal!" },
      { emoji: "🦕", text: "Was as heavy as a car but only as tall as an elephant" }
    ]
  },
  "diplodocus": {
    name: "Diplodocus",
    period: "Late Jurassic (154-152 million years ago)",
    facts: [
      { emoji: "📏", text: "One of the longest dinosaurs ever - up to 85 feet long!" },
      { emoji: "🦒", text: "Had a super long neck to reach leaves high in trees" },
      { emoji: "💨", text: "Could crack its tail like a whip - loud enough to scare predators!" },
      { emoji: "🥬", text: "Ate plants all day long - needed lots of food for its huge body" }
    ]
  },
  "mammoth": {
    name: "Woolly Mammoth",
    period: "Ice Age (400,000-4,000 years ago)",
    facts: [
      { emoji: "🧥", text: "Had thick woolly fur up to 3 feet long to stay warm in the Ice Age" },
      { emoji: "🦷", text: "Tusks could grow up to 15 feet long - curved like spirals!" },
      { emoji: "❄️", text: "Lived alongside early humans who painted them in caves" },
      { emoji: "🐘", text: "Close relative of modern elephants - looked like a furry elephant!" }
    ]
  },
  "smilodon": {
    name: "Smilodon (Saber-Tooth Cat)",
    period: "Ice Age (2.5 million-10,000 years ago)",
    facts: [
      { emoji: "🦁", text: "Had 7-inch fangs - longer than a banana!" },
      { emoji: "💪", text: "Was much stronger than modern lions, built like a wrestler" },
      { emoji: "🎯", text: "Used its huge teeth to take down mammoths and bison" },
      { emoji: "🐱", text: "Not actually a tiger - it's its own special kind of cat!" }
    ]
  },
  "pteranodon": {
    name: "Pteranodon",
    period: "Late Cretaceous (86-84 million years ago)",
    facts: [
      { emoji: "✈️", text: "Wingspan of up to 23 feet - wider than a small airplane!" },
      { emoji: "🦅", text: "Not a dinosaur, but a flying reptile called a pterosaur" },
      { emoji: "🐟", text: "Scooped fish from the ocean like a pelican" },
      { emoji: "👒", text: "Had a cool crest on its head - scientists aren't sure why!" }
    ]
  },
  "ankylosaurus": {
    name: "Ankylosaurus",
    period: "Late Cretaceous (68-66 million years ago)",
    facts: [
      { emoji: "🛡️", text: "Covered head-to-tail in bony armor plates like a tank!" },
      { emoji: "🔨", text: "Tail club could break bones - even T-Rex stayed away!" },
      { emoji: "🐢", text: "Built low to the ground so predators couldn't flip it over" },
      { emoji: "🧱", text: "Even its eyelids had armor on them!" }
    ]
  },
  "ichthyosaurus": {
    name: "Ichthyosaurus",
    period: "Early Jurassic (200-190 million years ago)",
    facts: [
      { emoji: "🐬", text: "Looked like a dolphin but was actually a marine reptile!" },
      { emoji: "👀", text: "Had the biggest eyes of any animal ever - to see in dark water" },
      { emoji: "🏊", text: "One of the fastest swimmers in prehistoric oceans" },
      { emoji: "🦎", text: "Gave birth to live babies instead of laying eggs" }
    ]
  },
  "trilobite": {
    name: "Trilobite",
    period: "Cambrian to Permian (521-252 million years ago)",
    facts: [
      { emoji: "🦀", text: "One of the first animals with eyes - they were made of crystal!" },
      { emoji: "📅", text: "Lived for over 270 million years - way longer than dinosaurs!" },
      { emoji: "🪲", text: "Related to modern crabs, lobsters, and insects" },
      { emoji: "🌊", text: "Lived on the ocean floor eating tiny bits of food" }
    ]
  },
  "fossil": {
    name: "Ancient Fossil",
    period: "Millions of years ago",
    facts: [
      { emoji: "🪨", text: "Fossils form when bones get buried and turn to stone over millions of years" },
      { emoji: "🔬", text: "Scientists called paleontologists study fossils to learn about the past" },
      { emoji: "🗺️", text: "Fossils have been found on every continent, even Antarctica!" },
      { emoji: "💎", text: "The oldest fossils are over 3.5 billion years old!" }
    ]
  },
  "egg": {
    name: "Dinosaur Egg",
    period: "Mesozoic Era (252-66 million years ago)",
    facts: [
      { emoji: "🥚", text: "Dinosaur eggs came in many shapes - round, oval, and even long tubes!" },
      { emoji: "📏", text: "The biggest dino eggs were about the size of a football" },
      { emoji: "🪺", text: "Some dinosaurs built nests and cared for their babies like birds" },
      { emoji: "🐣", text: "Baby dinosaurs hatched from eggs just like birds and reptiles today" }
    ]
  },
  "default": {
    name: "Prehistoric Creature",
    period: "Millions of years ago",
    facts: [
      { emoji: "🦕", text: "Dinosaurs ruled the Earth for over 160 million years!" },
      { emoji: "🌍", text: "Fossils help us learn what life was like long before humans existed" },
      { emoji: "🔍", text: "New dinosaur species are discovered every year around the world" },
      { emoji: "⭐", text: "You're looking at something that lived millions of years ago!" }
    ]
  }
};

function getFactsForAsset(asset) {
  const title = (asset.title + " " + asset.subject + " " + asset.altText).toLowerCase();
  
  for (const [key, data] of Object.entries(dinoFacts)) {
    if (key !== "default" && title.includes(key)) {
      return data;
    }
  }
  
  // Check for specific keywords
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
  shuffled.forEach(asset => {
    const facts = getFactsForAsset(asset);
    const card = document.createElement("div");
    card.className = "discovery-card";
    card.innerHTML = `
      <img src="${asset.formats.web}" alt="${asset.altText}" loading="lazy" />
      <div class="card-label">${facts.name}</div>
    `;
    card.addEventListener("click", () => openDinoModal(asset));
    elements.discovery_grid.append(card);
  });
}

function openDinoModal(asset) {
  playSound('click');
  
  const facts = getFactsForAsset(asset);
  
  if (elements.modal_img) elements.modal_img.src = asset.formats.web;
  if (elements.modal_title) elements.modal_title.textContent = facts.name;
  if (elements.modal_period) elements.modal_period.textContent = `🕐 ${facts.period}`;
  
  if (elements.modal_facts) {
    elements.modal_facts.innerHTML = facts.facts.map(f => 
      `<div class="fact-item"><span class="fact-emoji">${f.emoji}</span>${f.text}</div>`
    ).join("");
  }
  
  elements.dino_modal?.classList.remove("hidden");
  
  // Track discovery for achievements
  if (!state.discoveredDinos) state.discoveredDinos = [];
  if (!state.discoveredDinos.includes(facts.name)) {
    state.discoveredDinos.push(facts.name);
    if (state.discoveredDinos.length >= 5) {
      unlockCardIfNew("Junior Paleontologist", "Rare");
      markCupStep("create_dino", true); // Reuse cup step for discoveries
    }
    if (state.discoveredDinos.length >= 10) {
      unlockCardIfNew("Dino Expert", "Epic");
    }
    saveState();
    refreshCollection();
  }
}

function closeModal() {
  elements.dino_modal?.classList.add("hidden");
}

function showRandomDino() {
  const randomAsset = assetManifest.assets[Math.floor(Math.random() * assetManifest.assets.length)];
  openDinoModal(randomAsset);
  playSound('fossil');
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
    { id: "create_dino", label: "Discover 5 different dinosaurs" },
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
