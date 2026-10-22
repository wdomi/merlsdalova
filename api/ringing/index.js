import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Shared team code (Vercel env var RINGING_TEAM_CODE), sent by the form as "x-team-code"
function hasValidCode(req) {
  const expected = process.env.RINGING_TEAM_CODE || "";
  const given = String(req.headers["x-team-code"] || "");
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

const NUMBER_FIELDS = [
  "ring_L_t", "ring_L_b", "ring_R_t", "ring_R_b",
  "transect_id_ringing", "nest_ringing", "latitude", "longitude",
  "observer_id", "capture_method", "sex_id", "age_at_ringing_id",
  "weight_gr", "beak_mm", "tarsus_mm", "wing_mm", "feather_mm"
];
const TEXT_FIELDS = ["ring_number", "name", "ringed_date", "ringed_time", "ringed_as", "remark"];

function cleanBird(body) {
  const bird = {};
  for (const f of TEXT_FIELDS) {
    const v = body[f];
    bird[f] = v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim();
  }
  for (const f of NUMBER_FIELDS) {
    const v = body[f];
    if (v === undefined || v === null || String(v).trim() === "") { bird[f] = null; continue; }
    const n = Number(String(v).replace(",", "."));
    bird[f] = Number.isFinite(n) ? n : null;
  }
  bird.add_observation = body.add_observation === true;
  bird.add_blood_sample = body.add_blood_sample === true;
  return bird;
}

function validate(bird) {
  const errors = [];
  if (!bird.ring_number) errors.push("Ringnummer fehlt.");
  if (!bird.ringed_date) errors.push("Beringungsdatum fehlt.");
  if (!bird.observer_id) errors.push("Beringer/in fehlt.");
  if (!bird.capture_method) errors.push("Fangmethode fehlt.");
  if (!bird.transect_id_ringing && !bird.nest_ringing && bird.latitude === null) {
    errors.push("Ort fehlt: Transekt, Nest oder Koordinaten angeben.");
  }
  if (bird.transect_id_ringing && bird.nest_ringing) {
    errors.push("Entweder Transekt oder Nest angeben, nicht beides.");
  }
  if ((bird.latitude === null) !== (bird.longitude === null)) {
    errors.push("Breite und Länge nur zusammen angeben.");
  }
  return errors;
}

function ringsKey(b) {
  const parts = [b.ring_L_t, b.ring_L_b, b.ring_R_t, b.ring_R_b];
  if (parts.every(p => p === null)) return null;
  return parts.map(p => (p === null ? "" : String(p))).join("|");
}

// Existing birds with the same ring number or the same colour-ring combination
async function findDuplicates(bird) {
  const found = [];
  if (bird.ring_number) {
    const { data, error } = await supabase
      .from("individual").select("id, ring_number, name").eq("ring_number", bird.ring_number);
    if (error) throw error;
    for (const d of data) found.push({ ...d, reason: "Ringnummer existiert bereits" });
  }
  const key = ringsKey(bird);
  if (key) {
    const { data, error } = await supabase
      .from("individual").select("id, ring_number, name").eq("rings_key", key);
    if (error) throw error;
    for (const d of data) found.push({ ...d, reason: "Farbring-Kombination existiert bereits" });
  }
  return found;
}

async function loadLookups() {
  const ref = supabase.schema("ref");
  const queries = {
    rings: ref.from("rings").select("id, code, color").order("id"),
    transects: ref.from("transects").select("id, display_name, transect_code, mid_lat, mid_lon").order("transect_code"),
    persons: ref.from("persons").select("id, name, surname").order("name"),
    age_categories: ref.from("age_categories").select("id, code, name").order("id"),
    sex_categories: ref.from("sex_categories").select("id, code, remark").order("id"),
    capture_methods: ref.from("capture_methods").select("id, code, remark").order("id"),
    sites: supabase.from("site").select("id, display_name, name, transect_id").order("display_name")
  };
  const out = {};
  for (const [key, q] of Object.entries(queries)) {
    const { data, error } = await q;
    if (error) throw new Error(`${key}: ${error.message}`);
    out[key] = data;
  }
  return out;
}

export default async function handler(req, res) {
  if (!hasValidCode(req)) {
    return res.status(401).json({ error: "Teamcode fehlt oder ist falsch." });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json(await loadLookups());
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body || {};
    const bird = cleanBird(body.bird || {});

    if (body.mode === "check") {
      return res.status(200).json({ errors: validate(bird), duplicates: await findDuplicates(bird) });
    }

    if (body.mode === "save") {
      const errors = validate(bird);
      if (errors.length) return res.status(400).json({ error: errors.join(" ") });

      const duplicates = await findDuplicates(bird);
      if (duplicates.length) {
        return res.status(409).json({
          error: duplicates.map(d => `${d.reason}: ${d.ring_number} (${d.name || "ohne Name"})`).join("; ")
        });
      }

      const { data, error } = await supabase.rpc("ring_bird", { p: bird });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: `Unknown mode: ${body.mode}` });
  } catch (err) {
    console.error("ringing API failed:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
