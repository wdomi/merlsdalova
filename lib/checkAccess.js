import { timingSafeEqual } from "crypto";

// Shared access code for the internal finder app (Vercel env APP_ACCESS_CODE).
// The app sends it in the "X-Access-Code" header. Without a configured code
// every request is refused, so the API is never accidentally open.
export function checkAccess(req, res) {
  const expected = process.env.APP_ACCESS_CODE || "";
  const given = String(req.headers["x-access-code"] || "");

  if (!expected) {
    console.error("APP_ACCESS_CODE is not set – refusing request");
    res.status(500).json({ error: "Access code not configured" });
    return false;
  }

  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: "Zugangscode fehlt oder ist falsch." });
    return false;
  }

  return true;
}
