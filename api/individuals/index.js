import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // 1. Fetch ONLY from the 'individual' table. No joins.
    const { data: individuals, error } = await supabase
      .from("individual")
      .select(`
        id,
        ring_number,
        name,
        age_at_ringing,
        sex_id,
        ring_L_t,
        ring_L_b,
        ring_R_t,
        ring_R_b
      `)
      .order("ring_number");

    if (error) {
      console.error("Supabase Fetch Error:", error);
      return res.status(500).json({ error: error.message });
    }

    // 2. Simple Mapping
    const birds = (individuals || []).map(b => {
      
      // Helper to handle potential nulls
      const getVal = (val) => (val === null ? "" : String(val));

      return {
        individual_id: b.id,
        bird_id: b.ring_number || "",
        name: b.name || "",
        sex: b.sex_id ? String(b.sex_id) : "U", // Temporarily show ID if no join
        age: b.age_at_ringing || "",

        // Directly pass the value from the DB. 
        // If your DB stores "red", this works. If it stores "3", we fix in Step 2.
        L_top: getVal(b.ring_L_t),
        L_bottom: getVal(b.ring_L_b),
        R_top: getVal(b.ring_R_t),
        R_bottom: getVal(b.ring_R_b)
      };
    });

    return res.status(200).json(birds);

  } catch (err) {
    console.error("Server Crash:", err);
    return res.status(500).json({ error: err.toString() });
  }
}
