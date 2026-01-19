/***************************************************************************
 * Merlotschadaua – FULL app.js (UNIFIED REPORT FLOW)
 **************************************************************************/

console.log("Merlotschadaua app.js loaded");

L.TileLayer.prototype.options.crossOrigin = true;

// ------------------------------------------------------------------------
// GLOBAL STATE
// ------------------------------------------------------------------------

let birds = [];
let selectedRight = [];
let selectedLeft = [];
let perBirdSelection = new Map();

let map = null;
let marker = null;

let birdSearchQuery = "";

const CSV_URL = "/data/view_birdsCSV_apps.csv";
const DEFAULT_CENTER = [46.7000, 10.0833];
const OFFLINE_QUEUE_KEY = "merlotschadaua_offline_queue";

// ------------------------------------------------------------------------
// OFFLINE QUEUE
// ------------------------------------------------------------------------

function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setOfflineQueue(q) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q || []));
}

function addToOfflineQueue(entry) {
  const q = getOfflineQueue();
  q.push({ ...entry, queued_at: new Date().toISOString() });
  setOfflineQueue(q);
}

async function flushOfflineQueue() {
  if (!navigator.onLine) return;

  const q = getOfflineQueue();
  if (!q.length) return;

  const remaining = [];
  for (const entry of q) {
    try {
      await sendToServer(entry);
    } catch {
      remaining.push(entry);
    }
  }
  setOfflineQueue(remaining);
}

// ------------------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------------------

const ACTION_IDS = {
  sighted: 4519311,
  maybe: 4519312
};

const COLOR_PALETTE = {
  alu: "#808080",
  white: "#eee",
  red: "#e22c22",
  yellow: "#d6a51c",
  green: "#227722",
  blue: "#4b77b8",
  violet: "#6e009e",
  pink: "#f58ac7",
  black: "#222"
};

const COLOR_ORDER = [
  "alu","white","red","yellow","green","blue","pink","violet","black"
];

// ------------------------------------------------------------------------
// INIT
// ------------------------------------------------------------------------

window.addEventListener("load", () => {
  loadCSV();
  setupButtons();
  flushOfflineQueue();
});

// ------------------------------------------------------------------------
// CSV
// ------------------------------------------------------------------------

function loadCSV() {
  fetch(CSV_URL)
    .then(r => r.text())
    .then(t => t.replace(/^\uFEFF/, ""))
    .then(parseCSV)
    .then(rows => {
      birds = rows;
      buildColorButtons();
      renderBirds();
    })
    .catch(err => {
      console.error(err);
      alert("CSV konnte nicht geladen werden.");
    });
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0]
    .match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
    .map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());

  const idx = k => header.indexOf(k);

  return lines.slice(1).map(raw => {
    const cols = raw
      .match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
      .map(v => v.replace(/^"|"$/g, "").trim());

    return {
      bird_id: cols[idx("bird_id")] || "",
      name: cols[idx("name")] || "",
      sex: cols[idx("sex")] || "",
      age: cols[idx("age")] || "",
      R_top: (cols[idx("r_top")] || "").toLowerCase(),
      R_bottom: (cols[idx("r_bottom")] || "").toLowerCase(),
      L_top: (cols[idx("l_top")] || "").toLowerCase(),
      L_bottom: (cols[idx("l_bottom")] || "").toLowerCase(),
      territory: cols[idx("territory_name")] || "",
      dist: cols[idx("dist punt dal gal (m)")] || "",
      banded_on: cols[idx("banded_on")] || ""
    };
  }).filter(Boolean);
}

// ------------------------------------------------------------------------
// COLOR BUTTONS
// ------------------------------------------------------------------------

function buildColorButtons() {
  ["right", "left"].forEach(side => {
    const el = document.getElementById(side + "-leg");
    el.innerHTML = "";

    COLOR_ORDER.forEach(color => {
      const btn = document.createElement("button");
      btn.className = "color-button";
      btn.textContent = color;
      btn.style.background = COLOR_PALETTE[color];
      btn.style.color = color === "white" ? "#000" : "#fff";
      btn.onclick = () => toggleColor(side, color, btn);
      el.appendChild(btn);
    });
  });
}

function toggleColor(side, color, btn) {
  const arr = side === "right" ? selectedRight : selectedLeft;

  if (arr.includes(color)) {
    arr.splice(arr.indexOf(color), 1);
    btn.classList.remove("selected");
  } else if (arr.length < 2) {
    arr.push(color);
    btn.classList.add("selected");
  }

  renderBirds();
}

// ------------------------------------------------------------------------
// FILTER & RENDER TABLE
// ------------------------------------------------------------------------

function birdMatches(b) {
  const R = [b.R_top, b.R_bottom].filter(Boolean);
  const L = [b.L_top, b.L_bottom].filter(Boolean);

  if (!selectedRight.every(c => R.includes(c))) return false;
  if (!selectedLeft.every(c => L.includes(c))) return false;

  if (birdSearchQuery) {
    const haystack = `${b.name} ${b.bird_id}`.toLowerCase();
    if (!haystack.includes(birdSearchQuery)) return false;
  }

  return true;
}

function colorPill(c) {
  if (!c) return "";
  const hex = COLOR_PALETTE[c] || "#777";
  const text = c === "white" ? "#000" : "#fff";
  return `<span style="background:${hex};color:${text};padding:2px 4px;border-radius:4px;font-size:11px;">${c.slice(0,3)}</span>`;
}

function renderBirds() {
  const body = document.getElementById("birds-body");
  if (!body) return;

  body.innerHTML = "";

  birds.filter(birdMatches).forEach(b => {
    const act = perBirdSelection.get(b.bird_id) || "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.name}<div class="tag">${b.bird_id}</div></td>
      <td>${b.sex}<br>${b.age}</td>
      <td>${b.territory} (${b.dist})<br>${b.banded_on}</td>
      <td>${colorPill(b.R_top)}/${colorPill(b.R_bottom)} ${colorPill(b.L_top)}/${colorPill(b.L_bottom)}</td>
      <td>
        <button class="submit-btn submit-btn-ghost action-btn ${act==="sighted" ? "selected-action" : ""}" data-id="${b.bird_id}" data-action="sighted">beobachtet</button>
        <button class="submit-btn submit-btn-ghost action-btn ${act==="maybe" ? "selected-action" : ""}" data-id="${b.bird_id}" data-action="maybe">unsicher</button>
      </td>
    `;
    body.appendChild(tr);
  });

  document.querySelectorAll(".action-btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const current = perBirdSelection.get(id);

      if (current === action) perBirdSelection.delete(id);
      else perBirdSelection.set(id, action);

      renderBirds();
    };
  });
}

// ------------------------------------------------------------------------
// SAVE REPORTS
// ------------------------------------------------------------------------

async function saveSelectedReports() {
  const entries = window._pendingSelections;
  if (!entries || !entries.length) return;

  const lat = Number(document.getElementById("report-lat").value);
  const lng = Number(document.getElementById("report-lon").value);

  if (isNaN(lat) || isNaN(lng)) {
    alert("Ungültige Koordinaten.");
    return;
  }

  const lv95 = wgs84ToLV95(lat, lng);

  const dateVal = document.getElementById("report-date").value;
  const timeVal = document.getElementById("report-time").value || "";

  for (const entry of entries) {
    const actionId = ACTION_IDS[entry.action];
    if (!actionId) return;

    const payload = {
      bird_name: entry.bird.name || "",
      bird_id: entry.bird.bird_id || "",
      action: actionId,
      latitude: lat,
      longitude: lng,
      lat_LV95: lv95.north,
      lon_LV95: lv95.east,
      elevation_LV95: lv95.height,
      territory: entry.bird.territory || "",
      field_6525910: dateVal,
      field_6525920: timeVal
    };

    if (!navigator.onLine) addToOfflineQueue(payload);
    else await sendToServer(payload);
  }

  closePopup("popup-report-bg");
  perBirdSelection.clear();
  renderBirds();
  alert("Gespeichert.");
}
