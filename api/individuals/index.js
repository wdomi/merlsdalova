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
    // STEP 1: Fetch ONLY individual data (NO JOINS). This is guaranteed to work.
    const { data: individuals, error: indError } = await supabase
      .from("individual")
      .select("id, ring_number, name, age_at_ringing, sex_id, ringed_date, nest_ringing, ring_L_t, ring_L_b, ring_R_t, ring_R_b")
      .order("ring_number");

    if (indError) {
      console.error("❌ Basic Fetch Failed:", indError);
      return res.status(500).json({ error: indError.message });
    }

    // STEP 2: Get Ring Colors (Safe Fallback)
    const ringIds = new Set();
    individuals.forEach(b => {
      [b.ring_L_t, b.ring_L_b, b.ring_R_t, b.ring_R_b].forEach(id => {
        if (id) ringIds.add(id);
      });
    });

    let ringColorsMap = {};
    if (ringIds.size > 0) {
      // Try ref.rings first
      let { data: ringsData } = await supabase.schema('ref').from('rings').select('id, color').in('id', Array.from(ringIds));
      // Fallback to public.rings
      if (!ringsData || ringsData.length === 0) {
        const { data: publicData } = await supabase.from('rings').select('id, color').in('id', Array.from(ringIds));
        ringsData = publicData;
      }
      if (ringsData) {
        ringsData.forEach(r => {
          ringColorsMap[r.id] = COLOR_MAP[r.color || r.name] || (r.color || r.name);
        });
      }
    }

    // STEP 3: Try to Fetch Site Data SEPARATELY (Non-Critical)
    // We do this separately so if it fails, the bird list still loads.
    const siteIds = individuals
      .map(b => b.nest_ringing)
      .filter(id => id !== null && id !== undefined);

    let siteMap = {};
    if (siteIds.length > 0) {
      try {
        // Adjust 'site' and column names if your table is named differently
        const { data: sitesData } = await supabase
          .from("site") 
          .select("id, name, distance_from_pdg_m")
          .in("id", siteIds);
        
        if (sitesData) {
          sitesData.forEach(s => {
            siteMap[s.id] = {
              name: s.name || "undefined",
              dist: s.distance_from_pdg_m !== null ? s.distance_from_pdg_m : "undefined"
            };
          });
        }
      } catch (siteErr) {
        console.warn("⚠️ Site data fetch failed (non-fatal):", siteErr.message);
        // We continue anyway, territory will just be "undefined"
      }
    }

    // STEP 4: Map Everything
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
    console.error("💥 Critical Server Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
