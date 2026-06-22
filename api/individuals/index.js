import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COLOR_MAP = {
  alu: "alu",
  whi: "white",
  bla: "black",
  yel: "yellow",
  red: "red",
  blu: "blue",
  gre: "green",
  pin: "pink",
  vio: "violet"
};

export default async function handler(req, res) {
  try {

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
      return res.status(500).json({ error: error.message });
    }

    const { data: rings } = await supabase
      .schema("ref")
      .from("rings")
      .select("id, code");

    const ringMap = {};
    (rings || []).forEach(r => {
      ringMap[r.id] = COLOR_MAP[r.code] || r.code;
    });

    const birds = (individuals || []).map(b => ({
      individual_id: b.id,

      // visual identifier
      bird_id: b.ring_number || "",

      name: b.name || "",

      sex: b.sex_id || "",

      age: b.age_at_ringing || "",

      L_top: ringMap[b.ring_L_t] || "",
      L_bottom: ringMap[b.ring_L_b] || "",

      R_top: ringMap[b.ring_R_t] || "",
      R_bottom: ringMap[b.ring_R_b] || ""
    }));

    return res.status(200).json(birds);

  } catch (err) {

    return res.status(500).json({
      error: err.toString()
    });

  }
}
