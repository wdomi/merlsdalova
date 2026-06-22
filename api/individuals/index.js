import { createClient } from "@supabase/supabase-js";

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
    // STEP 1: Fetch basic individual data (NO JOINS) - This should never fail
    const { data: individuals, error: fetchError } = await supabase
      .from("individual")
      .select("id, ring_number, name, age_at_ringing, sex_id, ring_L_t, ring_L_b, ring_R_t, ring_R_b")
      .order("ring_number");

    if (fetchError) {
      console.error("❌ BASIC FETCH FAILED:", fetchError);
      return res.status(500).json({ 
        error: "Basic fetch failed", 
        message: fetchError.message, 
        details: fetchError.details 
      });
    }

    if (!individuals || individuals.length === 0) {
      return res.status(200).json([]);
    }

    // STEP 2: Collect all unique Ring IDs to fetch their colors manually
    const ringIds = new Set();
    individuals.forEach(b => {
      if (b.ring_L_t) ringIds.add(b.ring_L_t);
      if (b.ring_L_b) ringIds.add(b.ring_L_b);
      if (b.ring_R_t) ringIds.add(b.ring_R_t);
      if (b.ring_R_b) ringIds.add(b.ring_R_b);
    });

    let ringColorsMap = {};

    if (ringIds.size > 0) {
      // Try to fetch from 'ref.rings' explicitly
      // We assume the table is named 'rings' in the 'ref' schema
      const { data: ringsData, error: ringsError } = await supabase
        .schema('ref')
        .from('rings')
        .select('id, color')
        .in('id', Array.from(ringIds));

      if (ringsError) {
        console.warn("⚠️ Could not fetch ring colors automatically:", ringsError.message);
        console.warn("Hint: Ensure 'ref.rings' table exists and is accessible.");
        // We continue anyway, colors will just be empty/IDs
      } else if (ringsData) {
        // Build a map: { 1: "red", 2: "blue" }
        ringsData.forEach(r => {
          ringColorsMap[r.id] = COLOR_MAP[r.color] || r.color;
        });
      }
    }

    // STEP 3: Map everything together manually
    const birds = individuals.map(b => {
      return {
        individual_id: b.id,
        bird_id: b.ring_number || "",
        name: b.name || "",
        sex: b.sex_id ? String(b.sex_id) : "U", // Simplified sex handling
        age: b.age_at_ringing || "",
        
        // Map IDs to Colors using our manual map
        L_top: ringColorsMap[b.ring_L_t] || "",
        L_bottom: ringColorsMap[b.ring_L_b] || "",
        R_top: ringColorsMap[b.ring_R_t] || "",
        R_bottom: ringColorsMap[b.ring_R_b] || ""
      };
    });

    return res.status(200).json(birds);

  } catch (err) {
    console.error("💥 SERVER CRASH:", err);
    return res.status(500).json({ error: err.toString(), stack: err.stack });
  }
}
