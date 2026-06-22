import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};

  // =========================
  // LIST OBSERVATIONS
  // =========================
  if (body.mode === "list") {

    const { data, error } = await supabase
      .from("ind_observation")
      .select("*")
      .eq("deleted", false)
      .order("id", { ascending: false })
      .limit(200);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data || []);
  }

  // =========================
  // DELETE
  // =========================
  if (body.mode === "set_deleted") {

    const { error } = await supabase
      .from("ind_observation")
      .update({ deleted: body.deleted })
      .eq("id", body.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  }

  // =========================
  // ACTION → CAPTURE METHOD
  // =========================

  const captureMethodMap = {
    sighted: 1,
    maybe: 4,
    catch: 2,
    nest_ringing: 7,
    dead_find: 6
  };

  const capture_method =
    captureMethodMap[body.action] || 1;

  // =========================
  // INSERT
  // =========================
try {

  const { error } = await supabase
    .from("ind_observation")
    .insert({
      date: body.field_6525910,
      latitude: body.latitude,
      longitude: body.longitude,
      action: body.action,
      capture_method,
      deleted: false
    });

  if (error) {
    console.error("SUPABASE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });

} catch (err) {

  console.error("SERVER ERROR:", err);

  return res.status(500).json({
    error: err.toString()
  });

}
