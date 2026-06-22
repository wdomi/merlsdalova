import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COLOR_MAP = {
  alu: "alu", white: "white", black: "black", yellow: "yellow",
  red: "red", blue: "blue", green: "green", pink: "pink", violet: "violet"
};

const SEX_MAP = { 1: "U", 2: "F", 3: "M" };

export default async function handler(req, res) {
  try {
    // 1. Fetch Individuals
    const { data: individuals, error: indError } = await supabase
      .from("individual")
      .select("id, ring_number, name, age_at_ringing, sex_id, ringed_date, nest_ringing, ring_L_t, ring_L_b, ring_R_t, ring_R_b")
      .order("ring_number");

    if (indError) throw indError;

    // 2. Collect Ring IDs
    const ringIds = new Set();
    individuals.forEach(b => {
      [b.ring_L_t, b.ring_L_b, b.ring_R_t, b.ring_R_b].forEach(id => {
        if (id !== null && id !== undefined) ringIds.add(id);
      });
    });

    let ringColorsMap = {};

    if (ringIds.size > 0) {
      console.log("🔍 Fetching colors for IDs:", Array.from(ringIds));

      // 3. Fetch from ref.rings EXPLICITLY
      const { data: ringsData, error: ringsError } = await supabase
        .schema('ref') // Explicitly set schema
        .from('rings') // Table name
        .select('id, color, name, code') // Select multiple possible column names
        .in('id', Array.from(ringIds));

      if (ringsError) {
        console.error("❌ Error fetching ref.rings:", ringsError.message);
      } else if (ringsData) {
        console.log("✅ Found rings data:", ringsData);
        ringsData.forEach(r => {
          // Try 'color' first, then 'name', then 'code'
          const rawColor = r.color || r.name || r.code;
          if (rawColor) {
            ringColorsMap[r.id] = COLOR_MAP[rawColor] || rawColor;
          }
        });
      } else {
        console.warn("⚠️ No rings data found for these IDs.");
      }
    }

    // 4. Fetch Site Data (Non-Critical)
    const siteIds = individuals.map(b => b.nest_ringing).filter(id => id);
    let siteMap = {};
    if (siteIds.length > 0) {
      try {
        const { data: sitesData } = await supabase.from("site").select("id, name, distance_from_pdg_m").in("id", siteIds);
        if (sitesData) {
          sitesData.forEach(s => {
            siteMap[s.id] = { name: s.name || "undefined", dist: s.distance_from_pdg_m ?? "undefined" };
          });
        }
      } catch (e) { /* Ignore site errors */ }
    }

    // 5. Map Final Data
    const birds = individuals.map(b => {
      const siteData = siteMap[b.nest_ringing] || { name: "undefined", dist: "undefined" };
      return {
        individual_id: b.id,
        bird_id: b.ring_number || "",
        name: b.name || "",
        sex: SEX_MAP[b.sex_id] || "U",
        age: b.age_at_ringing || "unknown",
        banded_on: b.ringed_date || "undefined",
        territory: siteData.name,
        dist: siteData.dist,
        L_top: ringColorsMap[b.ring_L_t] || "",
        L_bottom: ringColorsMap[b.ring_L_b] || "",
        R_top: ringColorsMap[b.ring_R_t] || "",
        R_bottom: ringColorsMap[b.ring_R_b] || ""
      };
    });

    return res.status(200).json(birds);

  } catch (err) {
    console.error("💥 Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}
