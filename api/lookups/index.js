import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Options for the report form, read from the ref tables so that
// changes there show up in the app without a code change
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [ages, eyes] = await Promise.all([
      supabase.schema("ref").from("age_categories").select("id, code, name").order("id"),
      supabase.schema("ref").from("eye_color_categories").select("id, code, remark").order("id")
    ]);

    if (ages.error || eyes.error) {
      const msg = (ages.error || eyes.error).message;
      console.error("Lookup fetch failed:", msg);
      return res.status(500).json({ error: msg });
    }

    return res.status(200).json({
      age_categories: ages.data || [],
      eye_color_categories: eyes.data || []
    });

  } catch (err) {
    console.error("Lookups API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
