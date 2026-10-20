import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RING_ID_TO_COLOR = {
  1: "alu", 2: "white", 3: "black", 4: "yellow", 5: "red",
  6: "blue", 7: "green", 8: "rosa", 9: "violet",
  10: "pink", 11: "bronze", 12: "black_nr"
};

// Public, read-only list for the project website (wdomi/wasseramsel-spoel).
// Only names and ring colours leave the database – no ring numbers,
// nest sites or ringing dates.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { data, error } = await supabase
      .from("individual")
      .select("id, name, ring_L_t, ring_L_b, ring_R_t, ring_R_b")
      .order("name");

    if (error) {
      console.error("Public birds query failed:", error);
      return res.status(500).json({ error: "Database error" });
    }

    const birds = (data || [])
      .filter(b => b.ring_L_t || b.ring_L_b || b.ring_R_t || b.ring_R_b)
      .map(b => ({
        id: b.id,
        name: b.name || "",
        L_top: RING_ID_TO_COLOR[b.ring_L_t] || "",
        L_bottom: RING_ID_TO_COLOR[b.ring_L_b] || "",
        R_top: RING_ID_TO_COLOR[b.ring_R_t] || "",
        R_bottom: RING_ID_TO_COLOR[b.ring_R_b] || ""
      }));

    return res.status(200).json(birds);

  } catch (err) {
    console.error("Public birds API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
