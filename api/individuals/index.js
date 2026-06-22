import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COLOR_MAP = {
  alu: "alu",
  white: "white",
  black: "black",
  yellow: "yellow",
  red: "red",
  blue: "blue",
  green: "green",
  pink: "pink",
  violet: "violet"
};

export default async function handler(req, res) {
  try {
    // 1. Fetch individuals
    // We use .select() with explicit schema notation for the joined table: ref!foreign_key_name(column)
    // If your foreign key constraint is named differently, this might fail, 
    // so we use the standard Supabase syntax: table_name:foreign_key_column (columns)
    
    const { data: individuals, error } = await supabase
      .from("individual")
      .select(`
        id,
        ring_number,
        name,
        age_at_ringing,
        sex_id,
        
        -- Explicitly target the 'ref' schema for the rings table
        -- Syntax: ref_rings:ring_L_t ( color ) assumes the FK points to ref.rings
        -- If this fails, it means the FK constraint name or schema path is different.
        ring_L_t ( color ),
        ring_L_b ( color ),
        ring_R_t ( color ),
        ring_R_b ( color )
      `)
      // Try to specify schema for the main table if needed, usually 'public'
      .schema('public') 
      .order("ring_number");

    if (error) {
      console.error("❌ SUPABASE QUERY ERROR:", error);
      console.error("Details:", error.details);
      console.error("Hint:", error.hint);
      
      // Return a more specific error message to the browser for debugging
      return res.status(500).json({ 
        error: "Database query failed", 
        message: error.message,
        hint: error.hint || "Check if Foreign Keys exist between individual and ref.rings"
      });
    }

    // 2. Map the data
    const birds = (individuals || []).map(b => {
      // Helper to safely get color from joined object
      const getColor = (ringObj) => {
        // ringObj might be an array if the relationship is ambiguous, or an object
        const item = Array.isArray(ringObj) ? ringObj[0] : ringObj;
        if (!item || !item.color) return "";
        return COLOR_MAP[item.color] || item.color;
      };

      // Helper for sex (assuming simple value or join)
      let sexCode = "U";
      if (typeof b.sex_id === 'object' && b.sex_id !== null) {
         const sexData = Array.isArray(b.sex_id) ? b.sex_id[0] : b.sex_id;
         sexCode = sexData.code || sexData.id || "U";
      } else if (b.sex_id) {
         sexCode = String(b.sex_id); // Fallback to ID if no join
      }

      return {
        individual_id: b.id,
        bird_id: b.ring_number || "",
        name: b.name || "",
        sex: sexCode,
        age: b.age_at_ringing || "",
        L_top: getColor(b.ring_L_t),
        L_bottom: getColor(b.ring_L_b),
        R_top: getColor(b.ring_R_t),
        R_bottom: getColor(b.ring_R_b)
      };
    });

    return res.status(200).json(birds);

  } catch (err) {
    console.error("❌ SERVER CRASH:", err);
    return res.status(500).json({ error: err.toString() });
  }
}
