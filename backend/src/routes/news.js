import { Router } from "express";
import { FieldValue, newsCollection } from "../config/firestore.js";
import { newsSchema } from "../utils/validators.js";
import { verifyGoogle } from "../middleware/verifyGoogle.js";
import { apiKeyGuard } from "../middleware/apiKey.js";

const router = Router();

// Público: listar noticias (últimas primero). Soporta ?limit=1
router.get("/", async (req, res, next) => {
  try {
    const lim = Number(req.query.limit || 10);
    const snapshot = await newsCollection
      .orderBy("createdAt", "desc")
      .limit(Number.isNaN(lim) || lim <= 0 ? 10 : lim)
      .get();
    const news = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ news });
  } catch (err) {
    next(err);
  }
});

// Crear noticia: requiere Google; si se exige API key, se añade
const requireApiKey = (process.env.ENFORCE_ADMIN_API_KEY || "false").toLowerCase() === "true";

const createHandler = async (req, res, next) => {
  try {
    const parsed = newsSchema.parse(req.body);
    const docRef = await newsCollection.add({
      ...parsed,
      createdBy: req.user?.email || "admin",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const snap = await docRef.get();
    res.status(201).json({ item: { id: snap.id, ...snap.data() } });
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

