import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Map Integer IDs to Color Names
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
    // ✅ OPTIMIZED: Single Query with Join
    // We fetch 'individual' AND the related 'site' data in one go.
    // Syntax: alias:foreign_key_column ( columns_to_fetch )
    const { data: individuals, error: indError } = await supabase
      .from("individual")
      .select(`
        id,
        ring_number,
        name,
        age_at_ringing,
        sex_id,
        ringed_date,
        nest_ringing,
        ring_L_t,
        ring_L_b,
        ring_R_t,
        ring_R_b,
        -- Join the 'site' table automatically
        site:nest_ringing (
          name,
          distance_from_pdg_m
        )
      `)
      .order("ring_number");

    if (indError) {
      console.error("❌ Fetch Error:", indError);
      return res.status(500).json({ error: indError.message });
    }

    // ✅ Simplified Mapping (No second fetch needed)
    const birds = individuals.map(b => {
      // The join returns an array, so we take the first item if it exists
      const siteData = b.site?.[0] || { name: "undefined", distance_from_pdg_m: "undefined" };

      return {
        individual_id: b.id,
        bird_id: b.ring_number || "",
        name: b.name || "",
        sex: SEX_MAP[b.sex_id] || "U",
        age: b.age_at_ringing || "unknown",
        banded_on: b.ringed_date || "undefined",
        
        // Use the joined data directly
        territory: siteData.name,
        dist: siteData.distance_from_pdg_m !== null ? siteData.distance_from_pdg_m : "undefined",

        // Direct Mapping for Colors
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
