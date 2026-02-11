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

// 🔍 NEW: bird name / ID search
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
  // ring color filtering (existing logic)
  const R = [b.R_top, b.R_bottom].filter(Boolean);
  const L = [b.L_top, b.L_bottom].filter(Boolean);

  if (!selectedRight.every(c => R.includes(c))) return false;
  if (!selectedLeft.every(c => L.includes(c))) return false;

  // 🔍 text search (NEW)
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
        <button
          class="submit-btn submit-btn-ghost action-btn ${act==="sighted" ? "selected-action" : ""}"
          data-id="${b.bird_id}"
          data-action="sighted">
          beobachtet
        </button>
        <button
          class="submit-btn submit-btn-ghost action-btn ${act==="maybe" ? "selected-action" : ""}"
          data-id="${b.bird_id}"
          data-action="maybe">
          unsicher
        </button>
      </td>
    `;
    body.appendChild(tr);
  });

  // IMPORTANT: rebind click handlers every render
  document.querySelectorAll(".action-btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const current = perBirdSelection.get(id);

      if (current === action) {
        perBirdSelection.delete(id); // toggle off
      } else {
        perBirdSelection.set(id, action); // set / switch
      }

      renderBirds(); // re-render to update visuals
    };
  });
}


// ------------------------------------------------------------------------
// BUTTONS
// ------------------------------------------------------------------------

function setupButtons() {
  document.getElementById("btn-reset").onclick = () => {
    selectedLeft = [];
    selectedRight = [];
    perBirdSelection.clear();
    document.querySelectorAll(".color-button").forEach(b => b.classList.remove("selected"));
    renderBirds();
  };
const searchEl = document.getElementById("bird-search");
if (searchEl) {
  searchEl.oninput = () => {
    birdSearchQuery = searchEl.value.trim().toLowerCase();
    renderBirds();
  };
}
  document.getElementById("btn-report").onclick = openReportPopup;
  document.getElementById("btn-unringed").onclick = () => {
    perBirdSelection.clear();
    perBirdSelection.set("unringed", "sighted");
    openReportPopup();
  };

  document.getElementById("lnk-latest").onclick = e => {
    e.preventDefault();
    loadLatest();
  };
}

// ------------------------------------------------------------------------
// REPORT POPUP + MAP
// ------------------------------------------------------------------------

function openReportPopup() {
  if (!perBirdSelection.size) {
    alert("Bitte mindestens einen Vogel auswählen.");
    return;
  }

  const entries = [];
  for (const [bird_id, action] of perBirdSelection.entries()) {
    let b = bird_id === "unringed"
      ? { bird_id: "", name: "unberingt", territory: "" }
      : birds.find(x => x.bird_id === bird_id);
    if (b) entries.push({ bird: b, action });
  }

  window._pendingSelections = entries;

const infoEl = document.getElementById("popup-bird-info");

if (entries.length === 1) {
  const b = entries[0].bird;
  infoEl.textContent =
    b.bird_id
      ? `${b.name} (${b.bird_id})`
      : "Unberingter Vogel";
} else {
  const names = entries.map(e => {
    const b = e.bird;
    return b.bird_id ? `${b.name} (${b.bird_id})` : "Unberingt";
  });

  infoEl.innerHTML = `
    <strong>${entries.length} Vögel ausgewählt:</strong>
    <ul style="margin:6px 0 0 16px; padding:0;">
      ${names.map(n => `<li>${n}</li>`).join("")}
    </ul>
  `;
}


  const now = new Date();
  document.getElementById("report-date").value = now.toISOString().slice(0,10);
  document.getElementById("report-time").value = now.toTimeString().slice(0,8);

  openPopup("popup-report-bg");
  initMap();
}

function initMap() {
  const mapDiv = document.getElementById("map");
  mapDiv.innerHTML = "";
  if (map) map.remove();

  map = L.map("map").setView(DEFAULT_CENTER, 12);

  L.tileLayer("https://api.maptiler.com/maps/topo-v4/{z}/{x}/{y}.png?key=hTUZRiAhto38o94bZonV", {
    maxZoom: 20,
    tileSize: 512,
    zoomOffset: -1
  }).addTo(map);

  marker = L.marker(DEFAULT_CENTER, { draggable: true }).addTo(map);
  marker.on("dragend", () => {
    const p = marker.getLatLng();
    updateCoords(p.lat, p.lng);
  });

  updateCoords(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);

  const latEl = document.getElementById("report-lat");
  const lonEl = document.getElementById("report-lon");

  function applyTypedCoords() {
    const lat = Number(latEl.value);
    const lon = Number(lonEl.value);
    if (!isNaN(lat) && !isNaN(lon)) {
      marker.setLatLng([lat, lon]);
      map.setView([lat, lon], map.getZoom());
    }
  }

  latEl.onchange = applyTypedCoords;
  lonEl.onchange = applyTypedCoords;

  document.getElementById("btn-find-me").onclick = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      marker.setLatLng([pos.coords.latitude, pos.coords.longitude]);
      map.setView([pos.coords.latitude, pos.coords.longitude], 15);
      updateCoords(pos.coords.latitude, pos.coords.longitude);
    });
  };

  const saveBtn = document.getElementById("btn-save-report");
if (saveBtn) saveBtn.onclick = saveSelectedReports;

    setTimeout(() => map.invalidateSize(), 200);

}

function updateCoords(lat, lng) {
  document.getElementById("report-lat").value = lat.toFixed(10);
  document.getElementById("report-lon").value = lng.toFixed(10);
}

// ------------------------------------------------------------------------
// SAVE REPORTS
// ------------------------------------------------------------------------

async function saveSelectedReports() {
  const entries = window._pendingSelections;
  if (!entries || !entries.length) return;

const lat = Number(document.getElementById("report-lat").value);
const lng = Number(document.getElementById("report-lon").value);
  // ⚠️ ORDER MATTERS: lat FIRST, lon SECOND
const lv95 = wgs84ToLV95(lat, lng);
  
  const dateVal = document.getElementById("report-date").value; // YYYY-MM-DD
const timeVal = document.getElementById("report-time").value || ""; // HH:MM or HH:MM:SS


  if (isNaN(lat) || isNaN(lng)) {
    alert("Ungültige Koordinaten.");
    return;
  }

  for (const entry of entries) {
    const actionId = ACTION_IDS[entry.action];

    if (!actionId) {
      alert("Bitte für jeden Vogel 'beobachtet' oder 'unsicher' auswählen.");
      return;
    }

const payload = {
  bird_name: entry.bird.name || "",
  bird_id: entry.bird.bird_id || "",
  action: actionId,
  latitude: lat,
  longitude: lng,

  // ✅ LV95 coordinates
  lat_LV95: lv95.north,
  lon_LV95: lv95.east,
  elevation_LV95: lv95.height,

  territory: entry.bird.territory || "",
  field_6525910: dateVal,
  field_6525920: timeVal
};

    try {
      if (!navigator.onLine) {
        addToOfflineQueue(payload);
      } else {
        await sendToServer(payload);
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("Fehler beim Speichern.");
      return;
    }
  }

  closePopup("popup-report-bg");
  perBirdSelection.clear();
  renderBirds();
  alert("Gespeichert.");
}

// ------------------------------------------------------------------------
// SERVER
// ------------------------------------------------------------------------

async function sendToServer(payload) {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }

  return res.json();
}




// ------------------------------------------------------------------------
// LATEST OBSERVATIONS - old 26-01-02 9:02
// ------------------------------------------------------------------------

async function loadLatest() {
  openPopup("popup-latest-bg");

  try {
    const r = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "list" })
    });

    latestData = await r.json();

// set popup map title of sliding bar (1/2)
const slider = document.getElementById("time-slider");
const label = document.getElementById("days-label");

// sync UI with current state (2/2)
slider.value = latestMaxDays;
label.textContent = latestMaxDays;

    
    initLatestMap();
    populateLatestDropdown();
    renderLatestMap();

  } catch (err) {
    alert("Fehler beim Laden der Beobachtungen.");
    console.error(err);
  }
}

// INITIALIZE MAP

function initLatestMap() {
  const el = document.getElementById("latest-map");
  el.innerHTML = "";

  if (latestMap) latestMap.remove();

  latestMap = L.map(el).setView([46.628584, 10.194596], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(latestMap);

  latestLayer = L.layerGroup().addTo(latestMap);

  setTimeout(() => latestMap.invalidateSize(), 200);
}


// DROP DOWN BIRDS

function populateLatestDropdown() {
  const sel = document.getElementById("latest-bird-filter");
  sel.innerHTML = `<option value="">Vogel auswählen</option>`;

  const seen = new Set();

  latestData.forEach(r => {
    const key = `${r.bird_name} (${r.bird_id})`;
    if (!seen.has(key)) {
      seen.add(key);
      const opt = document.createElement("option");
      opt.value = r.bird_id;
      opt.textContent = key;
      sel.appendChild(opt);
    }
  });

  sel.onchange = () => {
    latestBirdFilter = sel.value;
    renderLatestMap();
  };

  document.getElementById("latest-reset").onclick = () => {
    latestBirdFilter = "";
    sel.value = "";
    renderLatestMap();
  };

  const slider = document.getElementById("time-slider");
  const label = document.getElementById("days-label");

  slider.oninput = () => {
    latestMaxDays = Number(slider.value);
    label.textContent = slider.value;
    renderLatestMap();
  };
}



// RENDERING OBSERVATION BLOBS

function renderLatestMap() {
  latestLayer.clearLayers();

  const now = Date.now();

  latestData.forEach(r => {
    if (!r.latitude || !r.longitude || !r.date) return;

    if (latestBirdFilter && r.bird_id !== latestBirdFilter) return;

    const daysOld = (now - new Date(r.date)) / (1000 * 60 * 60 * 24);
    if (daysOld > latestMaxDays) return;

    const opacity = Math.max(0.2, 1 - daysOld / latestMaxDays);

    const color =
      r.action === 4519311 ? "#3b82f6" : // sighted → blue
      r.action === 4519312 ? "#f59e0b" : // maybe → orange
      "#999";

    L.circleMarker([r.latitude, r.longitude], {
      radius: 10,
      fillColor: color,
      fillOpacity: opacity,
      stroke: false
    })
      .bindPopup(
        `<strong>${r.bird_name}</strong> (${r.bird_id || "—"})<br>
         ${r.date}`
      )
      .addTo(latestLayer);
  });
}



// ------------------------------------------------------------------------
// WGS84 → LV95 (CH1903+) – OFFICIAL swisstopo formula
// Accuracy: < 1 m
// ------------------------------------------------------------------------


function wgs84ToLV95(lat, lon) {
  const latSec = lat * 3600;
  const lonSec = lon * 3600;

  const latAux = (latSec - 169028.66) / 10000;
  const lonAux = (lonSec - 26782.5) / 10000;

  const east =
    2600000 +
    211455.93 * lonAux -
    10938.51 * lonAux * latAux -
    0.36 * lonAux * latAux ** 2 -
    44.54 * lonAux ** 3;

  const north =
    1200000 +
    308807.95 * latAux +
    3745.25 * lonAux ** 2 +
    76.63 * latAux ** 2 -
    194.56 * lonAux ** 2 * latAux +
    119.79 * latAux ** 3;

  return {
    east: Number(east.toFixed(2)),
    north: Number(north.toFixed(2))
  };
}






// ------------------------------------------------------------------------
// GLOBAL STATE POP UP MAP - new : 26-01-02 9:02
// ------------------------------------------------------------------------
let latestMap = null;
let latestLayer = null;
let latestData = [];
let latestBirdFilter = "";
let latestMaxDays = 14;



// ------------------------------------------------------------------------
// POPUPS
// ------------------------------------------------------------------------

function openPopup(id) {
  document.getElementById(id).style.display = "flex";
}
function closePopup(id) {
  document.getElementById(id).style.display = "none";
}
