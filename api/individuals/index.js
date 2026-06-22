import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map database color codes to your UI palette keys
const COLOR_MAP = {
  alu: "alu",
  white: "white", // Adjust these keys to match your DB's actual text values
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
    // Use the "->" syntax to join foreign keys directly in the query
    // This assumes ring_L_t is a foreign key to a table with a 'color' column
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
        ring_R_b,
        -- Join sex category
        sex_categories:sex_id ( code ),
        -- Join ring colors (Adjust 'rings' to your actual referenced table name if different)
        color_L_t:ring_L_t ( color ),
        color_L_b:ring_L_b ( color ),
        color_R_t:ring_R_t ( color ),
        color_R_b:ring_R_b ( color )
      `)
      .order("ring_number");

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: error.message });
    }

    const birds = (individuals || []).map(b => ({
      individual_id: b.id,
      bird_id: b.ring_number || "",
      name: b.name || "",
      
      // Safely extract nested sex code
      sex: b.sex_categories?.[0]?.code || "U",
      age: b.age_at_ringing || "",

      // Safely extract nested color and map to UI keys
      // We check if the join returned data before accessing .color
      L_top: b.color_L_t?.[0]?.color ? COLOR_MAP[b.color_L_t[0].color] || b.color_L_t[0].color : "",
      L_bottom: b.color_L_b?.[0]?.color ? COLOR_MAP[b.color_L_b[0].color] || b.color_L_b[0].color : "",
      R_top: b.color_R_t?.[0]?.color ? COLOR_MAP[b.color_R_t[0].color] || b.color_R_t[0].color : "",
      R_bottom: b.color_R_b?.[0]?.color ? COLOR_MAP[b.color_R_b[0].color] || b.color_R_b[0].color : ""
    }));

    return res.status(200).json(birds);

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: err.toString() });
  }
}
