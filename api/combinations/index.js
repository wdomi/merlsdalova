import { createClient } from "@supabase/supabase-js";
import { checkAccess } from "../../lib/checkAccess.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Combinations with the same colour twice on one leg (left or right)
async function loadDoubleColourCombinations() {
  const PAGE = 1000;
  let rows = [];

  // Page through all unused combinations (Supabase returns max 1000 rows)
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .schema("ref")
      .from("ring_combinations_status")
      .select("id, rings_key, color_combination, ring_l_t, ring_l_b, ring_r_t, ring_r_b, used")
      .eq("used", false)
      .order("id")
      .range(from, from + PAGE - 1);

    if (error) throw error;
    rows = rows.concat(data || []);
    if (!data || data.length < PAGE) break;
  }

  const doubles = rows.filter(r =>
    (r.ring_l_t != null && r.ring_l_t === r.ring_l_b) ||
    (r.ring_r_t != null && r.ring_r_t === r.ring_r_b)
  );

  // Shuffle and pick 10
  for (let i = doubles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubles[i], doubles[j]] = [doubles[j], doubles[i]];
  }

  return doubles.slice(0, 10).map(r => ({
    id: r.id,
    rings_key: r.rings_key,
    lt_lb_rt_rb: r.color_combination,
    used: r.used
  }));
}

export default async function handler(req, res) {
  if (!checkAccess(req, res)) return;

  try {

    if (req.query?.mode === "double") {
      return res.status(200).json(await loadDoubleColourCombinations());
    }

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
