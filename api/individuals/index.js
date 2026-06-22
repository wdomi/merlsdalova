import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map DB color strings to your UI palette keys
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
    // 1. Fetch individuals WITH joins to ref.rings and sex_categories
    // Syntax: alias:foreign_key_column ( column_you_want )
    const { data: individuals, error } = await supabase
      .from("individual")
      .select(`
        id,
        ring_number,
        name,
        age_at_ringing,
        
        -- Join Sex Category (Adjust 'sex_categories' if your table name differs)
        sex_id ( code ), 
        
        -- Join Ring Colors from ref.rings table
        ring_L_t ( color ),
        ring_L_b ( color ),
        ring_R_t ( color ),
        ring_R_b ( color )
      `)
      .order("ring_number");

    if (error) {
      console.error("Supabase Fetch Error:", error);
      return res.status(500).json({ error: error.message });
    }

    // 2. Map the nested data to flat objects for the frontend
    const birds = (individuals || []).map(b => {
      
      // Helper to safely extract color name from the joined object
      // b.ring_L_t is now an object like { color: "red" }, not a number
      const getColor = (ringObj) => {
        if (!ringObj || !ringObj.color) return "";
        return COLOR_MAP[ringObj.color] || ringObj.color;
      };

      // Helper to safely extract sex code
      const getSex = (sexObj) => {
        // If sex_id returns an array (one-to-many), take the first item
        const sexData = Array.isArray(sexObj) ? sexObj[0] : sexObj;
        return sexData?.code || "U";
      };

      return {
        individual_id: b.id,
        bird_id: b.ring_number || "",
        name: b.name || "",
        
        sex: getSex(b.sex_id),
        age: b.age_at_ringing || "",

        // Extract color from the joined objects
        L_top: getColor(b.ring_L_t),
        L_bottom: getColor(b.ring_L_b),
        R_top: getColor(b.ring_R_t),
        R_bottom: getColor(b.ring_R_b)
      };
    });

    return res.status(200).json(birds);

  } catch (err) {
    console.error("Server Crash:", err);
    return res.status(500).json({ error: err.toString() });
  }
}
