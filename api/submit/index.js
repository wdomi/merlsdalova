import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Allow CORS if needed for local testing, though Vercel usually handles this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
  // DELETE (Toggle deleted flag)
  // =========================
  if (body.mode === "set_deleted") {
    const { error } = await supabase
      .from("ind_observation")
      .update({ deleted: body.deleted }) // Expects true/false
      .eq("id", body.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  }

  // =========================
  // INSERT OBSERVATION
  // =========================

  // Strict mapping based on your requirements
  const captureMethodMap = {
    sighted: 1,        // "beobachtet"
    maybe: 4,          // "unsicher"
    catch: 2,          // "gefangen"
    nest_ringing: 7,   // "Nest_Beringung"
    dead_find: 6       // "Totfund"
  };

  const actionValue = body.action;
  const capture_method = captureMethodMap[actionValue];

  if (!capture_method) {
    return res.status(400).json({ error: `Invalid action: ${actionValue}` });
  }

  try {
    const payload = {
      individual_id: body.individual_id || null, // Allow null for unringed
      date: body.date,
      time_manual: body.time_manual || null,
      latitude: body.latitude,
      longitude: body.longitude,
      action: actionValue,
      capture_method: capture_method,
      observer: body.observer, // Now comes from the dropdown (2-13)
      deleted: false // Default to false
    };

    const { data, error } = await supabase
      .from("ind_observation")
      .insert(payload)
      .select(); // Return the inserted row for verification

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, data: data[0] });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: err.toString() });
  }
}
