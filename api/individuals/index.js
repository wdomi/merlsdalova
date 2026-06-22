// FORCE REBUILD v3 - 2026-06-22import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COLOR_MAP = {
  alu: "alu", white: "white", black: "black", yellow: "yellow",
  red: "red", blue: "blue", green: "green", pink: "pink", violet: "violet"
};

export default async function handler(req, res) {
  try {
    // 1. Fetch Individuals (No joins)
    const { data: individuals, error: indError } = await supabase
      .from("individual")
      .select("id, ring_number, name, age_at_ringing, sex_id, ring_L_t, ring_L_b, ring_R_t, ring_R_b")
      .order("ring_number");

    if (indError) throw indError;
    if (!individuals || individuals.length === 0) return res.status(200).json([]);

    // 2. Collect unique Ring IDs
    const ringIds = new Set();
    individuals.forEach(b => {
      [b.ring_L_t, b.ring_L_b, b.ring_R_t, b.ring_R_b].forEach(id => {
        if (id !== null && id !== undefined) ringIds.add(id);
      });
    });

    let ringColorsMap = {};

    if (ringIds.size > 0) {
      console.log("🔍 Fetching colors for IDs:", Array.from(ringIds));

      // TRY A: Fetch from 'ref' schema
      let { data: ringsData, error: ringsError } = await supabase
        .schema('ref')
        .from('rings')
        .select('id, color')
        .in('id', Array.from(ringIds));

      // TRY B: If 'ref' failed or returned nothing, try 'public' schema
      if (ringsError || !ringsData || ringsData.length === 0) {
        console.warn("⚠️ 'ref.rings' failed or empty. Trying 'public.rings'...");
        const { data: publicData, error: publicError } = await supabase
          .from('rings') // Defaults to public schema
          .select('id, color')
          .in('id', Array.from(ringIds));
        
        if (publicError) {
          console.error("❌ 'public.rings' also failed:", publicError.message);
        } else {
          ringsData = publicData; // Use the public data instead
          console.log("✅ Found data in 'public.rings':", ringsData);
        }
      } else {
        console.log("✅ Found data in 'ref.rings':", ringsData);
      }

      // Build the map
      if (ringsData) {
        ringsData.forEach(r => {
          // Handle case where column might be named 'name' or 'code' instead of 'color'
          const colorVal = r.color || r.name || r.code; 
          ringColorsMap[r.id] = COLOR_MAP[colorVal] || colorVal;
        });
      }
    }

    // 3. Map Final Data
    const birds = individuals.map(b => ({
      individual_id: b.id,
      bird_id: b.ring_number || "",
      name: b.name || "",
      sex: b.sex_id ? String(b.sex_id) : "U",
      age: b.age_at_ringing || "",
      L_top: ringColorsMap[b.ring_L_t] || "",
      L_bottom: ringColorsMap[b.ring_L_b] || "",
      R_top: ringColorsMap[b.ring_R_t] || "",
      R_bottom: ringColorsMap[b.ring_R_b] || ""
    }));

    return res.status(200).json(birds);

  } catch (err) {
    console.error("💥 CRITICAL ERROR:", err);
    return res.status(500).json({ error: err.message, hint: err.hint });
  }
}
