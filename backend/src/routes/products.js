import { Router } from "express";
import { FieldValue, productsCollection } from "../config/firestore.js";
import { productSchema } from "../utils/validators.js";
import { apiKeyGuard } from "../middleware/apiKey.js";
import { verifyGoogle } from "../middleware/verifyGoogle.js";

const router = Router();

const toProduct = (doc) => ({ id: doc.id, ...doc.data() });

// Nota: GET es público para el catálogo. POST/PATCH requieren Google y, opcionalmente, API Key.

router.get("/", async (req, res, next) => {
  try {
    const { category, limit = 20 } = req.query;
    let query = productsCollection.orderBy("createdAt", "desc");

    if (category) {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.limit(Number(limit)).get();
    const products = snapshot.docs.map(toProduct);

    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
  }
});

const requireApiKey = (process.env.ENFORCE_ADMIN_API_KEY || "false").toLowerCase() === "true";

const createHandler = async (req, res, next) => {
  try {
    const parsed = productSchema.parse({
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
    });

    if (!parsed.image && !parsed.imageData) {
      return res.status(400).json({ error: "Se requiere imagen" });
    }

    const created = await productsCollection.add({
      ...parsed,
      owner: req.user?.email || "admin",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snapshot = await created.get();
    res.status(201).json({ product: toProduct(snapshot) });
  } catch (error) {
    next(error);
  }
};

if (requireApiKey) {
  router.post("/", verifyGoogle, apiKeyGuard, createHandler);
} else {
  router.post("/", verifyGoogle, createHandler);
}

const patchHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const nextStock = Number(stock);

    if (Number.isNaN(nextStock) || nextStock < 0) {
      return res.status(400).json({ error: "Stock inválido" });
    }

    const ref = productsCollection.doc(id);
    await ref.update({
      stock: nextStock,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snapshot = await ref.get();
    res.json({ product: toProduct(snapshot) });
  } catch (error) {
    next(error);
  }
};

if (requireApiKey) {
  router.patch("/:id/stock", verifyGoogle, apiKeyGuard, patchHandler);
} else {
  router.patch("/:id/stock", verifyGoogle, patchHandler);
}

// Patch genérico para actualizar precio/stock (y potencialmente otros campos controlados)
const patchGenericHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = {};
    if (req.body.price !== undefined) {
      const p = Number(req.body.price);
      if (Number.isNaN(p) || p < 0) return res.status(400).json({ error: "Precio inválido" });
      update.price = p;
    }
    if (req.body.stock !== undefined) {
      const s = Number(req.body.stock);
      if (Number.isNaN(s) || s < 0) return res.status(400).json({ error: "Stock inválido" });
      update.stock = s;
    }
    if (!Object.keys(update).length) {
      return res.status(400).json({ error: "Nada para actualizar" });
    }
    update.updatedAt = FieldValue.serverTimestamp();
    const ref = productsCollection.doc(id);
    await ref.update(update);
    const snapshot = await ref.get();
    res.json({ product: toProduct(snapshot) });
  } catch (error) {
    next(error);
  }
};

if (requireApiKey) {
  router.patch("/:id", verifyGoogle, apiKeyGuard, patchGenericHandler);
} else {
  router.patch("/:id", verifyGoogle, patchGenericHandler);
}

// PATCH completo: mezcla con el documento actual, valida y actualiza
const toArrayTags = (tags) => {
  if (!tags) return undefined;
  if (Array.isArray(tags)) return tags.filter(Boolean);
  return String(tags)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
};

const patchFullHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Normaliza campos numéricos y de tags
    const incoming = { ...req.body };
    if (incoming.price !== undefined) incoming.price = Number(incoming.price);
    if (incoming.stock !== undefined) incoming.stock = Number(incoming.stock);
    if (incoming.tags !== undefined) incoming.tags = toArrayTags(incoming.tags);

    const ref = productsCollection.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Producto no existe" });
    const current = snap.data();
    // Muestra final que queremos persistir
    const merged = { ...current, ...incoming };
    // Validación completa
    productSchema.parse(merged);

    await ref.update({
      ...incoming,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const updated = await ref.get();
    res.json({ product: toProduct(updated) });
  } catch (error) {
    if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
    next(error);
  }
};

if (requireApiKey) {
  router.patch("/:id/full", verifyGoogle, apiKeyGuard, patchFullHandler);
} else {
  router.patch("/:id/full", verifyGoogle, patchFullHandler);
}

export default router;
