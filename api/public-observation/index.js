import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RING_ID_TO_COLOR = {
  1: "alu", 2: "white", 3: "black", 4: "yellow", 5: "red",
  6: "blue", 7: "green", 8: "rosa", 9: "violet",
  10: "pink", 11: "bronze", 12: "black_nr"
};

const COLORS = new Set(Object.values(RING_ID_TO_COLOR));

// Origins allowed to post observations (comma separated in ALLOWED_ORIGINS)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://wdomi.github.io")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function setCors(req, res) {
  const origin = req.headers.origin || "";
  const ok =
    ALLOWED_ORIGINS.includes(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (ok) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clean(s, max = 500) {
  return String(s ?? "").trim().slice(0, max);
}

// Public observation report from the project website.
// Nothing is written to the database: the observation is emailed to the
// project lead (OBSERVATION_EMAIL_TO) via Resend, with the observer as reply-to.
export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};

  // Honeypot field: real users never see or fill it
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.observer_name, 120);
  const email = clean(body.observer_email, 200);
  const phone = clean(body.observer_phone, 60);
  const date = clean(body.date, 10);
  const time = clean(body.time, 5);
  const remark = clean(body.remark, 2000);
  const count = Math.max(1, Math.min(20, parseInt(body.count, 10) || 1));
  const lat = Number(body.latitude);
  const lon = Number(body.longitude);

  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "name_email" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date" });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < 45.5 || lat > 47.9 || lon < 5.8 || lon > 10.6) {
    return res.status(400).json({ error: "coordinates" });
  }

  // Ring colours as reported by the observer (unknown values are dropped)
  const rings = {};
  ["L_top", "L_bottom", "R_top", "R_bottom"].forEach(k => {
    const v = clean(body.rings?.[k], 20);
    rings[k] = COLORS.has(v) ? v : "";
  });

  // Look up the chosen bird server-side so the email shows the stored data
  let bird = null;
  const birdId = parseInt(body.individual_id, 10);
  if (Number.isFinite(birdId)) {
    const { data } = await supabase
      .from("individual")
      .select("id, ring_number, name, ring_L_t, ring_L_b, ring_R_t, ring_R_b")
      .eq("id", birdId)
      .maybeSingle();
    bird = data || null;
  }

  const to = process.env.OBSERVATION_EMAIL_TO;
  const apiKey = process.env.RESEND_API_KEY;
  if (!to || !apiKey) {
    console.error("OBSERVATION_EMAIL_TO or RESEND_API_KEY missing");
    return res.status(500).json({ error: "mail_not_configured" });
  }

  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
  const geoadmin = `https://map.geo.admin.ch/?swisssearch=${lat},${lon}&zoom=10`;
  const ringText = r =>
    `L: ${r.L_top || "–"}/${r.L_bottom || "–"} · R: ${r.R_top || "–"}/${r.R_bottom || "–"}`;

  const birdLine = bird
    ? `${esc(bird.name || "–")} (${esc(bird.ring_number || "")}) – ${esc(ringText({
        L_top: RING_ID_TO_COLOR[bird.ring_L_t], L_bottom: RING_ID_TO_COLOR[bird.ring_L_b],
        R_top: RING_ID_TO_COLOR[bird.ring_R_t], R_bottom: RING_ID_TO_COLOR[bird.ring_R_b]
      }))}`
    : "nicht zugeordnet";

  const rows = [
    ["Datum", `${esc(date)} ${esc(time)}`],
    ["Individuum (gewählt)", birdLine],
    ["Ringe (gemeldet)", esc(ringText(rings))],
    ["Anzahl Vögel", String(count)],
    ["Koordinaten (WGS84)", `${lat.toFixed(6)}, ${lon.toFixed(6)} – <a href="${osm}">OSM</a> · <a href="${geoadmin}">map.geo.admin</a>`],
    ["Bemerkung", esc(remark).replace(/\n/g, "<br>") || "–"],
    ["Beobachter/in", esc(name)],
    ["E-Mail", `<a href="mailto:${esc(email)}">${esc(email)}</a>`],
    ["Telefon", esc(phone) || "–"],
    ["Sprache Formular", esc(clean(body.lang, 5)) || "–"]
  ];

  const html = `
    <h2>Neue Wasseramsel-Meldung (Website)</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr><td style="vertical-align:top"><b>${k}</b></td><td>${v}</td></tr>`).join("")}
    </table>`;

  const subjectBird = bird?.name || (rings.L_top || rings.R_top ? "beringt" : "ohne Zuordnung");

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.OBSERVATION_EMAIL_FROM || "Wasseramsel Spöl <onboarding@resend.dev>",
        to: to.split(",").map(s => s.trim()),
        reply_to: email,
        subject: `Wasseramsel-Meldung ${date}: ${subjectBird}`,
        html
      })
    });

    if (!r.ok) {
      console.error("Resend error:", r.status, await r.text());
      return res.status(502).json({ error: "mail_failed" });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("Public observation API error:", err);
    return res.status(500).json({ error: "server" });
  }
}
