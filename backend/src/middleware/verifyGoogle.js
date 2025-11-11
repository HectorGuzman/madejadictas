import { OAuth2Client } from "google-auth-library";

const clientId = process.env.GOOGLE_CLIENT_ID;
const allowed = (process.env.ALLOWED_ADMINS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const oauthClient = clientId ? new OAuth2Client(clientId) : null;

export const verifyGoogle = async (req, res, next) => {
  try {
    if (!oauthClient || !clientId) {
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID no configurado" });
    }

    const auth = req.header("authorization") || req.header("Authorization");
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
      return res.status(401).json({ error: "Falta token de Google (Bearer)" });
    }

    const idToken = auth.slice(7).trim();
    const ticket = await oauthClient.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();

    const email = (payload?.email || "").toLowerCase();
    if (!email || (allowed.length && !allowed.includes(email))) {
      return res.status(403).json({ error: "Cuenta no autorizada" });
    }

    req.user = { email, name: payload?.name, picture: payload?.picture, sub: payload?.sub };
    next();
  } catch (err) {
    console.error("verifyGoogle error", err?.message);
    return res.status(401).json({ error: "Token inválido" });
  }
};

