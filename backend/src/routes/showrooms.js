import { Router } from "express";
import { FieldValue, showroomsCollection } from "../config/firestore.js";
import { showroomSchema } from "../utils/validators.js";
import { verifyGoogle } from "../middleware/verifyGoogle.js";
import { apiKeyGuard } from "../middleware/apiKey.js";

const router = Router();

// Público: listar showrooms
router.get("/", async (req, res, next) => {
  try {
    const snapshot = await showroomsCollection.orderBy("date", "desc").limit(50).get();
    const showrooms = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ showrooms });
  } catch (err) {
    next(err);
  }
});

// Crear showroom (equipo): requiere Google; si además se exige API key, se añade.
const requireApiKey = (process.env.ENFORCE_ADMIN_API_KEY || "false").toLowerCase() === "true";

const createHandler = async (req, res, next) => {
  try {
    const parsed = showroomSchema.parse(req.body);
    const docRef = await showroomsCollection.add({
      ...parsed,
      cover: parsed.photos?.[0] || null,
      createdBy: req.user?.email || "admin",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const snap = await docRef.get();
    res.status(201).json({ showroom: { id: snap.id, ...snap.data() } });
  } catch (err) {
    next(err);
  }
};

if (requireApiKey) {
  router.post("/", verifyGoogle, apiKeyGuard, createHandler);
} else {
  router.post("/", verifyGoogle, createHandler);
}

export default router;

