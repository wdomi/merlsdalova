import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Map Integer IDs to Color Names exactly as you specified
const RING_ID_TO_COLOR = {
  1: "alu",
  2: "white",
  3: "black",
  4: "yellow",
  5: "red",
  6: "blue",
  7: "green",
  8: "pink",
  9: "violet"
};

// 2. Map Sex IDs
const SEX_MAP = { 1: "U", 2: "F", 3: "M" };

export default async function handler(req, res) {
  try {
    // 3. Fetch ONLY individual table. No joins needed for colors!
    const { data: individuals, error: indError } = await supabase
      .from("individual")
      .select("id, ring_number, name, age_at_ringing, sex_id, ringed_date, nest_ringing, ring_L_t, ring_L_b, ring_R_t, ring_R_b")
      .order("ring_number");

    if (indError) {
      console.error("❌ Fetch Error:", indError);
      return res.status(500).json({ error: indError.message });
    }

    // 4. Fetch Site Data (Territory) - Separate fetch to avoid crashes
    const siteIds = individuals.map(b => b.nest_ringing).filter(id => id !== null && id !== undefined);
    let siteMap = {};
    
    if (siteIds.length > 0) {
      try {
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
      } catch (e) {
        console.warn("⚠️ Site data fetch failed (non-fatal)", e.message);
      }
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

        // ✅ DIRECT MAPPING: Convert Integer ID to Color Name
        L_top: RING_ID_TO_COLOR[b.ring_L_t] || "",
        L_bottom: RING_ID_TO_COLOR[b.ring_L_b] || "",
        R_top: RING_ID_TO_COLOR[b.ring_R_t] || "",
        R_bottom: RING_ID_TO_COLOR[b.ring_R_b] || ""
      };
    });

    return res.status(200).json(birds);

  } catch (err) {
    console.error("💥 Server Crash:", err);
    return res.status(500).json({ error: err.message });
  }
}
