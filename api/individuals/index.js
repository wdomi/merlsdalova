import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COLOR_MAP = {
  alu: "alu", white: "white", black: "black", yellow: "yellow",
  red: "red", blue: "blue", green: "green", pink: "pink", violet: "violet"
};

// 1. Sex Code Mapping as requested
const SEX_MAP = {
  1: "U",
  2: "F",
  3: "M"
};

export default async function handler(req, res) {
  try {
    // 2. Fetch Individuals + Join Site Data for Territory/Distance
    // We assume 'nest_ringing' is the foreign key to 'site.id'
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
        -- Join the 'site' table to get territory name and distance
        site:nest_ringing (
          name,
          distance_from_pdg_m
        )
      `)
      .order("ringed_date");

    if (indError) {
      console.error("❌ Supabase Error:", indError);
      return res.status(500).json({ error: indError.message });
    }

    // 3. Collect Ring IDs for Color Lookup
    const ringIds = new Set();
    individuals.forEach(b => {
      [b.ring_L_t, b.ring_L_b, b.ring_R_t, b.ring_R_b].forEach(id => {
        if (id !== null && id !== undefined) ringIds.add(id);
      });
    });

    let ringColorsMap = {};

    if (ringIds.size > 0) {
      // Try 'ref' schema first, then 'public'
      let { data: ringsData } = await supabase.schema('ref').from('rings').select('id, color').in('id', Array.from(ringIds));
      
      if (!ringsData || ringsData.length === 0) {
        const { data: publicData } = await supabase.from('rings').select('id, color').in('id', Array.from(ringIds));
        ringsData = publicData;
      }

      if (ringsData) {
        ringsData.forEach(r => {
          const colorVal = r.color || r.name || r.code;
          ringColorsMap[r.id] = COLOR_MAP[colorVal] || colorVal;
        });
      }
    }

    // 4. Map Final Data for Frontend
    const birds = individuals.map(b => {
      // Handle Site Join (Territory & Distance)
      // The join returns an array, so we take the first item if it exists
      const siteData = Array.isArray(b.site) ? b.site[0] : b.site;
      const territoryName = siteData?.name || "undefined";
      const distance = siteData?.distance_from_pdg_m !== null ? siteData.distance_from_pdg_m : "undefined";

      return {
        individual_id: b.id,
        bird_id: b.ring_number || "",
        name: b.name || "",
        
        // Map Sex ID to Code (e.g., 3 -> "M")
        sex: SEX_MAP[b.sex_id] || "U",
        
        age: b.age_at_ringing || "unknown",
        
        // Format Date (YYYY-MM-DD)
        banded_on: b.ringed_date || "undefined",
        
        // Combine Territory and Distance
        territory: territoryName,
        dist: distance,

        // Ring Colors
        L_top: ringColorsMap[b.ring_L_t] || "",
        L_bottom: ringColorsMap[b.ring_L_b] || "",
        R_top: ringColorsMap[b.ring_R_t] || "",
        R_bottom: ringColorsMap[b.ring_R_b] || ""
      };
    });

    return res.status(200).json(birds);

  } catch (err) {
    console.error("💥 Server Crash:", err);
    return res.status(500).json({ error: err.toString() });
  }
}
