import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {

    const { data, error } = await supabase
      .schema("ref")
      .from("free_ring_combinations")
      .select("id, rings_key, lt_lb_rt_rb, used")
      .eq("used", false)
      .order("id");

    if (error) {
      console.error("Failed to load ring combinations:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data || []);

  } catch (err) {
    console.error("Critical combinations API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
