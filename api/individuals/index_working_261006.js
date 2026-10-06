import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RING_ID_TO_COLOR = {
  1: "alu", 2: "white", 3: "black", 4: "yellow", 5: "red",
  6: "blue", 7: "green", 8: "pink", 9: "violet"
};

const SEX_MAP = { 1: "U", 2: "F", 3: "M" };

export default async function handler(req, res) {
  try {
    // STEP 1: Fetch Individuals ONLY (No joins, no constraints needed)
    const { data: individuals, error: indError } = await supabase
      .from("individual")
      .select("id, ring_number, name, age_at_ringing, sex_id, ringed_date, nest_ringing, ring_L_t, ring_L_b, ring_R_t, ring_R_b")
      .order("ring_number");

    if (indError) {
      console.error("❌ Step 1 (Individuals) Failed:", indError);
      return res.status(500).json({ error: indError.message });
    }

    if (!individuals || individuals.length === 0) {
      return res.status(200).json([]);
    }

    // STEP 2: Collect all unique Site IDs
    const siteIds = individuals
      .map(b => b.nest_ringing)
      .filter(id => id !== null && id !== undefined);

    let siteMap = {};

    // STEP 3: Fetch Site Data ONLY if we have IDs
    if (siteIds.length > 0) {
      const { data: sitesData, error: siteError } = await supabase
        .from("site")
        .select("id, name, distance_from_pdg_m");
      
      // Filter the results to only include the IDs we need (efficient client-side filtering)
      if (!siteError && sitesData) {
        sitesData.forEach(s => {
          if (siteIds.includes(s.id)) {
            siteMap[s.id] = {
              name: s.name || "undefined",
              dist: s.distance_from_pdg_m !== null ? s.distance_from_pdg_m : "undefined"
            };
          }
        });
      } else {
        console.warn("⚠️ Site fetch failed (non-fatal):", siteError?.message);
      }
    }

    // STEP 4: Merge Data Manually
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
