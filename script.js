// ================================
// OMAD G‘ILDIRAGI
// ================================

const $ = (id) => document.getElementById(id);

const wheel = $("wheel");
const wheelLabels = $("wheelLabels");
const spinBtn = $("spinBtn");

const STORAGE_KEY = "omadGildiragiGame";

const defaultItems = [
  "10 ball",
  "20 ball",
  "50 ball",
  "Omad!",
  "100 ball",
  "Yana imkon",
  "Ajoyib sovg‘a",
  "0 ball"
];

const themes = {
  purple: ["#ff4f8b", "#8c54ff", "#26b9ed", "#16c79a", "#ffb13d", "#ed5bd4", "#4e78ff", "#ff704d"],
  ocean: ["#00b4d8", "#0077b6", "#48cae4", "#0096c7", "#90e0ef", "#4361ee", "#4cc9f0", "#3a86ff"],
  sunset: ["#ff595e", "#ff924c", "#ffca3a", "#ff6b6b", "#f72585", "#b5179e", "#f77f00", "#e85d04"],
  forest: ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2", "#386641", "#6a994e", "#a7c957"]
};

let game = loadGame();

let items = game.items;
let score = game.score;
let record = game.record;
let spinCount = game.spinCount;
let giftCount = game.giftCount;
let history = game.history;
let currentTheme = game.theme || "purple";

let spinning = false;
let rotation = 0;
let soundOn = game.soundOn !== false;
let daily = getDailyData();

// ================================
// SAQLASH VA YUKLASH
// ================================

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && Array.isArray(saved.items) && saved.items.length >= 2) {
      return {
        items: saved.items,
        score: Number(saved.score) || 0,
        record: Number(saved.record) || 0,
        spinCount: Number(saved.spinCount) || 0,
        giftCount: Number(saved.giftCount) || 0,
        history: Array.isArray(saved.history) ? saved.history : [],
        theme: saved.theme || "purple",
        soundOn: saved.soundOn !== false
      };
    }
  } catch (error) {
    console.log("Saqlangan ma'lumotlarni o'qishda xatolik:", error);
  }

  return {
    items: [...defaultItems],
    score: 0,
    record: 0,
    spinCount: 0,
    giftCount: 0,
    history: [],
    theme: "purple",
    soundOn: true
  };
}

function saveGame() {
  const data = {
    items,
    score,
    record,
    spinCount,
    giftCount,
    history,
    theme: currentTheme,
    soundOn
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDailyData() {
  const today = new Date().toLocaleDateString("en-CA");

  try {
    const saved = JSON.parse(localStorage.getItem("omadDaily"));

    if (saved && saved.date === today) {
      return {
        date: today,
        count: Number(saved.count) || 0,
        claimed: saved.claimed === true
      };
    }
  } catch (error) {
    console.log("Kunlik topshiriq ma'lumotlari o'qilmadi.");
  }

  return {
    date: today,
    count: 0,
    claimed: false
  };
}

function saveDaily() {
  localStorage.setItem("omadDaily", JSON.stringify(daily));
}

// ================================
// G‘ILDIRAKNI CHIZISH
// ================================

function renderWheel() {
  const colors = themes[currentTheme] || themes.purple;
  const angle = 360 / items.length;

  const gradientParts = items.map((item, index) => {
    const color = colors[index % colors.length];
    return `${color} ${index * angle}deg ${(index + 1) * angle}deg`;
  });

  wheel.style.background = `conic-gradient(${gradientParts.join(", ")})`;

  wheelLabels.innerHTML = "";

  items.forEach((item, index) => {
    const label = document.createElement("div");
    label.className = "wheel-label";
    label.textContent = item;

    const centerAngle = index * angle + angle / 2;

    label.style.transform = `
      translate(-50%, -50%)
      rotate(${centerAngle}deg)
      translateY(-${items.length <= 8 ? 125 : 135}px)
      rotate(-${centerAngle}deg)
    `;

    wheelLabels.appendChild(label);
  });

  renderSections();
}

// ================================
// BO‘LIMLAR RO‘YXATI
// ================================

function renderSections() {
  const list = $("sectionsList");
  list.innerHTML = "";

  items.forEach((item, index) => {
    const chip = document.createElement("div");
    chip.className = "section-chip";

    const name = document.createElement("span");
    name.textContent = item;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.title = "Bo‘limni o‘chirish";

    remove.addEventListener("click", () => {
      if (spinning) return;

      if (items.length <= 2) {
        showToast("G‘ildirakda kamida 2 ta bo‘lim bo‘lishi kerak!");
        return;
      }

      items.splice(index, 1);
      renderWheel();
      saveGame();
      showToast("Bo‘lim o‘chirildi.");
    });

    chip.append(name, remove);
    list.appendChild(chip);
  });
}

// ================================
// YANGI BO‘LIM QO‘SHISH
// ================================

$("addForm").addEventListener("submit", (event) => {
  event.preventDefault();

  if (spinning) return;

  const input = $("newItem");
  const value = input.value.trim();

  if (!value) {
    showToast("Avval bo‘lim nomini yozing!");
    return;
  }

  if (items.length >= 16) {
    showToast("Eng ko‘pi bilan 16 ta bo‘lim qo‘shish mumkin.");
    return;
  }

  items.push(value);
  input.value = "";

  renderWheel();
  saveGame();
  showToast("Yangi bo‘lim qo‘shildi! 🎉");
});

// ================================
// BALL VA STATISTIKA
// ================================

function updateStats() {
  $("score").textContent = score;
  $("totalScore").textContent = score;
  $("topScore").textContent = score;

  $("record").textContent = record;
  $("topRecord").textContent = record;

  $("spinCount").textContent = spinCount;
  $("giftCount").textContent = giftCount;

  const level = Math.floor(score / 100) + 1;
  $("level").textContent = level;

  const progress = score % 100;
  $("levelBar").style.width = progress + "%";
  $("nextLevel").textContent = (level + 1) + "-bosqich";

  const remaining = 100 - progress;
  $("levelText").textContent =
    `Keyingi bosqichga ${remaining} ball qoldi.`;

  updateRewards();
  updateDaily();
}

// ================================
// SOVG‘ALAR VA YUTUQLAR
// ================================

function updateRewards() {
  $("rewardOne").textContent = spinCount >= 1 ? "✅" : "🔒";
  $("rewardTwo").textContent = spinCount >= 10 ? "✅" : "🔒";
  $("rewardThree").textContent = spinCount >= 25 ? "✅" : "🔒";
}

// ================================
// KUNLIK TOPSHIRIQ
// ================================

function updateDaily() {
  const progress = Math.min(daily.count, 3);

  $("dailyProgress").textContent = progress;
  $("dailyBar").style.width = (progress / 3 * 100) + "%";

  if (daily.claimed) {
    $("missionStatus").textContent = "✅ Kunlik mukofot olindi!";
  } else if (progress >= 3) {
    $("missionStatus").textContent = "🎉 Topshiriq bajarildi! +30 ball berildi.";
  } else {
    $("missionStatus").textContent = `Yana ${3 - progress} marta aylantiring!`;
  }
}

function completeDailyTask() {
  daily.count++;

  if (daily.count >= 3 && !daily.claimed) {
    daily.claimed = true;
    score += 30;

    if (score > record) {
      record = score;
    }

    showToast("🎉 Kunlik topshiriq bajarildi! +30 ball!");
    playSound("reward");
  }

  saveDaily();
}

// ================================
// OVOZ EFFEKTLARI
// ================================

let audioContext = null;

function playSound(type = "click") {
  if (!soundOn) return;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    const sounds = {
      click: [400, 0.08],
      spin: [250, 0.12],
      win: [650, 0.2],
      reward: [850, 0.3]
    };

    const settings = sounds[type] || sounds.click;

    oscillator.frequency.value = settings[0];
    oscillator.type = "sine";

    gain.gain.setValueAtTime(0.12, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + settings[1]
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + settings[1]);
  } catch (error) {
    console.log("Ovoz ishga tushmadi:", error);
  }
}

$("soundBtn").addEventListener("click", () => {
  soundOn = !soundOn;

  $("soundBtn").textContent = soundOn ? "🔊" : "🔇";

  saveGame();

  if (soundOn) {
    playSound("click");
    showToast("Ovoz yoqildi.");
  } else {
    showToast("Ovoz o‘chirildi.");
  }
});

// ================================
// NATIJANI HISOBLASH
// ================================

function getPrizePoints(prize) {
  const match = prize.match(/(\d+)\s*ball/i);

  if (match) {
    return Number(match[1]);
  }

  if (prize.toLowerCase().includes("imkon")) {
    return 10;
  }

  if (prize.toLowerCase().includes("sovg")) {
    return 25;
  }

  if (prize.toLowerCase().includes("omad")) {
    return 15;
  }

  return 0;
}

function getPrizeEmoji(prize) {
  const text = prize.toLowerCase();

  if (text.includes("ball")) return "⭐";
  if (text.includes("imkon")) return "🔄";
  if (text.includes("sovg")) return "🎁";
  if (text.includes("omad")) return "🍀";

  return "🎉";
}

// ================================
// G‘ILDIRAKNI AYLANTIRISH
// ================================

function spinWheel() {
  if (spinning) return;

  if (items.length < 2) {
    showToast("Aylantirish uchun kamida 2 ta bo‘lim kerak.");
    return;
  }

  spinning = true;
  spinBtn.disabled = true;

  $("resultBox").classList.remove("show");
  $("spinNote").textContent = "G‘ildirak aylanmoqda...";

  playSound("spin");

  const selectedIndex = Math.floor(Math.random() * items.length);
  const prize = items[selectedIndex];

  const angle = 360 / items.length;
  const centerAngle = selectedIndex * angle + angle / 2;

  // Tanlangan bo‘limni ko‘rsatkich ostiga olib kelish
  const currentAngle = ((rotation % 360) + 360) % 360;
  const targetAngle = (360 - centerAngle + 360) % 360;

  let difference = (targetAngle - currentAngle + 360) % 360;
  difference += 360 * 6;

  rotation += difference;
  wheel.style.transform = `rotate(${rotation}deg)`;

  setTimeout(() => {
    finishSpin(prize);
  }, 5200);
}

function finishSpin(prize) {
  spinning = false;
  spinBtn.disabled = false;

  const points = getPrizePoints(prize);

  score += points;
  spinCount++;

  if (points > 0) {
    giftCount++;
  }

  if (score > record) {
    record = score;
  }

  const emoji = getPrizeEmoji(prize);

  $("resultEmoji").textContent = emoji;
  $("resultTitle").textContent = "Tabriklaymiz!";
  $("resultText").textContent =
    `${prize} — siz ${points} ball oldingiz!`;

  $("resultBox").classList.add("show");
  $("spinNote").textContent = "Yana bir marta aylantirishga tayyormisiz?";

  history.unshift({
    prize,
    points,
    time: new Date().toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit"
    })
  });

  history = history.slice(0, 20);

  completeDailyTask();
  updateStats();
  renderHistory();
  saveGame();

  playSound("win");

  if (points > 0) {
    showToast(`${emoji} ${prize}! +${points} ball`);
  } else {
    showToast("Bu safar 0 ball. Keyingi safar omad kulib boqsin!");
  }
}

spinBtn.addEventListener("click", spinWheel);

// ================================
// AYLANISHLAR TARIXI
// ================================

function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";

  if (history.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = "Hali aylanishlar mavjud emas.";
    list.appendChild(empty);
    return;
  }

  history.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";

    const left = document.createElement("span");
    left.textContent = `🎁 ${item.prize} · ${item.time}`;

    const right = document.createElement("span");
    right.textContent = `+${item.points} ⭐`;

    row.append(left, right);
    list.appendChild(row);
  });
}

$("clearHistory").addEventListener("click", () => {
  if (spinning) return;

  history = [];
  renderHistory();
  saveGame();
  showToast("Aylanishlar tarixi tozalandi.");
});

// ================================
// RANG MAVZULARI
// ================================

document.querySelectorAll(".theme-btn").forEach((button) => {
  button.addEventListener("click", () => {
    if (spinning) return;

    currentTheme = button.dataset.theme;

    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    renderWheel();
    saveGame();
    playSound("click");
  });
});

function setActiveThemeButton() {
  document.querySelectorAll(".theme-btn").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.theme === currentTheme
    );
  });
}

// ================================
// QAYTA BOSHLASH
// ================================

$("resetBtn").addEventListener("click", () => {
  if (spinning) return;

  const answer = confirm(
    "O‘yin natijalari, ballar va aylanishlar tarixi qayta boshlansinmi? Rekord saqlanib qoladi."
  );

  if (!answer) return;

  score = 0;
  spinCount = 0;
  giftCount = 0;
  history = [];

  daily = {
    date: new Date().toLocaleDateString("en-CA"),
    count: 0,
    claimed: false
  };

  saveDaily();

  $("resultBox").classList.remove("show");
  $("spinNote").textContent = "Tugmani bosing va omadni sinab ko‘ring!";

  updateStats();
  renderHistory();
  saveGame();

  showToast("O‘yin qayta boshlandi! Rekord saqlandi.");
});

// ================================
// XABAR CHIQARISH
// ================================

let toastTimeout;

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// ================================
// BOSHLANG‘ICH HOLAT
// ================================

function initGame() {
  renderWheel();
  renderHistory();
  updateStats();
  setActiveThemeButton();

  $("soundBtn").textContent = soundOn ? "🔊" : "🔇";
}

initGame();