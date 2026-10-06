import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RING_ID_TO_COLOR = {
  1: "alu", 2: "white", 3: "black", 4: "yellow", 5: "red",
  6: "blue", 7: "green", 8: "pink", 9: "violet"
};

const SEX_MAP = { 1: "U", 2: "F", 3: "M" };

export default async function handler(req, res) {
  try {
    // STEP 1: Fetch Individuals ONLY (No joins, no constraints needed)
    const { data: individuals, error: indError } = await supabase
      .from("individual")
      .select(`
        id,
        ring_number,
        name,
        age_at_ringing,
        sex_id,
        ringed_date,
        nest_ringing,
        nest_id_birth_ringing,
        nest_id_adult_ringing,
        transect_id_ringing,
        ring_L_t,
        ring_L_b,
        ring_R_t,
        ring_R_b
      `)
      .order("ring_number");

    if (indError) {
      console.error("❌ Step 1 (Individuals) Failed:", indError);
      return res.status(500).json({ error: indError.message });
    }

    if (!individuals || individuals.length === 0) {
      return res.status(200).json([]);
    }

    // STEP 2: Collect all unique Site IDs from all three possible site fields
    const siteIds = [
      ...new Set(
        individuals
          .flatMap(b => [
            b.nest_ringing,
            b.nest_id_birth_ringing,
            b.nest_id_adult_ringing
          ])
          .filter(id => id !== null && id !== undefined)
      )
    ];

    let siteMap = {};

    // STEP 3: Fetch Site Data ONLY if we have IDs
    if (siteIds.length > 0) {
      const { data: sitesData, error: siteError } = await supabase
        .from("site")
        .select("id, display_name, distance_from_pdg_m")
        .in("id", siteIds);

      if (!siteError && sitesData) {
        sitesData.forEach(s => {
          siteMap[s.id] = {
            name: s.display_name || "undefined",
            dist:
              s.distance_from_pdg_m !== null &&
              s.distance_from_pdg_m !== undefined
                ? s.distance_from_pdg_m
                : null
          };
        });
      } else {
        console.warn("⚠️ Site fetch failed (non-fatal):", siteError?.message);
      }
    }

    // STEP 4: Collect all unique Transect IDs
    const transectIds = [
      ...new Set(
        individuals
          .map(b => b.transect_id_ringing)
          .filter(id => id !== null && id !== undefined)
      )
    ];

    let transectMap = {};

    // STEP 5: Fetch Transect Data ONLY if we have IDs
    if (transectIds.length > 0) {
      const { data: transectsData, error: transectError } = await supabase
        .schema("ref")
        .from("transects")
        .select("id, display_name")
        .in("id", transectIds);

      if (!transectError && transectsData) {
        transectsData.forEach(t => {
          transectMap[t.id] = {
            name: t.display_name || "undefined"
          };
        });
      } else {
        console.warn(
          "⚠️ Transect fetch failed (non-fatal):",
          transectError?.message
        );
      }
    }

    // STEP 6: Merge Data Manually
    const birds = individuals.map(b => {

      let territory = "undefined";
      let dist = null;

      // Priority 1: nest_ringing
      if (
        b.nest_ringing !== null &&
        b.nest_ringing !== undefined &&
        siteMap[b.nest_ringing]
      ) {
        territory = siteMap[b.nest_ringing].name;
        dist = siteMap[b.nest_ringing].dist;
      }

      // Priority 2: nest_id_birth_ringing
      else if (
        b.nest_id_birth_ringing !== null &&
        b.nest_id_birth_ringing !== undefined &&
        siteMap[b.nest_id_birth_ringing]
      ) {
        territory = siteMap[b.nest_id_birth_ringing].name;
        dist = siteMap[b.nest_id_birth_ringing].dist;
      }

      // Priority 3: nest_id_adult_ringing
      else if (
        b.nest_id_adult_ringing !== null &&
        b.nest_id_adult_ringing !== undefined &&
        siteMap[b.nest_id_adult_ringing]
      ) {
        territory = siteMap[b.nest_id_adult_ringing].name;
        dist = siteMap[b.nest_id_adult_ringing].dist;
      }

      // Priority 4: transect_id_ringing
      else if (
        b.transect_id_ringing !== null &&
        b.transect_id_ringing !== undefined &&
        transectMap[b.transect_id_ringing]
      ) {
        territory = transectMap[b.transect_id_ringing].name;
        dist = null;
      }

      return {
        individual_id: b.id,
        bird_id: b.ring_number || "",
        name: b.name || "",
        sex: SEX_MAP[b.sex_id] || "U",
        age: b.age_at_ringing || "unknown",
        banded_on: b.ringed_date || "undefined",
        territory: territory,
        dist: dist,
        L_top: RING_ID_TO_COLOR[b.ring_L_t] || "",
        L_bottom: RING_ID_TO_COLOR[b.ring_L_b] || "",
        R_top: RING_ID_TO_COLOR[b.ring_R_t] || "",
        R_bottom: RING_ID_TO_COLOR[b.ring_R_b] || ""
      };
    });

    return res.status(200).json(birds);

  } catch (err) {
    console.error("💥 Critical Server Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
