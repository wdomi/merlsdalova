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

const SEX_MAP = { 1: "U", 2: "F", 3: "M" };

export default async function handler(req, res) {
  try {
    // STEP 1: Fetch individuals
    const { data: individuals, error: indError } = await supabase
      .from("individual")
      .select(`
        id,
        ring_number,
        name,
        age_at_ringing,
        sex_id,
        ringed_date,
        ring_L_t,
        ring_L_b,
        ring_R_t,
        ring_R_b
      `)
      .order("ring_number");

    if (indError) {
      console.error("❌ Step 1 (Individuals) Failed:", indError);
      return res.status(500).json({ error: indError.message });
    }

    if (!individuals || individuals.length === 0) {
      return res.status(200).json([]);
    }

    // STEP 2: Ringing place from the view: nest (nest_ringing) or transect
    // (transect_id_ringing, auto-computed from the coordinates in the DB).
    // The old nest_id_birth_ringing / nest_id_adult_ringing are deprecated.
    let locationMap = {};

    const { data: locations, error: locError } = await supabase
      .from("v_individual_location")
      .select("individual_id, nest_display_name, transect_display_name, distance_from_pdg_m");

    if (!locError && locations) {
      locations.forEach(l => {
        locationMap[l.individual_id] = l;
      });
    } else {
      console.warn("⚠️ Location fetch failed (non-fatal):", locError?.message);
    }

    // STEP 3: Merge Data Manually
    const birds = individuals.map(b => {

      const loc = locationMap[b.id];
      let territory = "undefined";
      let dist = null;

      if (loc?.nest_display_name) {
        territory = loc.nest_display_name;
        dist = loc.distance_from_pdg_m ?? null;
      } else if (loc?.transect_display_name) {
        territory = loc.transect_display_name;
      }

      return {
        individual_id: b.id,
        bird_id: b.ring_number || "",
        name: b.name || "",
        sex: SEX_MAP[b.sex_id] || "U",
        age: b.age_at_ringing || "unknown",
        banded_on: b.ringed_date || "undefined",
        territory: territory,
        dist: dist,
        L_top: RING_ID_TO_COLOR[b.ring_L_t] || "",
        L_bottom: RING_ID_TO_COLOR[b.ring_L_b] || "",
        R_top: RING_ID_TO_COLOR[b.ring_R_t] || "",
        R_bottom: RING_ID_TO_COLOR[b.ring_R_b] || ""
      };
    });

    return res.status(200).json(birds);

  } catch (err) {
    console.error("💥 Critical Server Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
