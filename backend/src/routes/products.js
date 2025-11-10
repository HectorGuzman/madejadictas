import { Router } from "express";
import { FieldValue, productsCollection } from "../config/firestore.js";
import { productSchema } from "../utils/validators.js";
import { apiKeyGuard } from "../middleware/apiKey.js";

const router = Router();

const toProduct = (doc) => ({ id: doc.id, ...doc.data() });

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

router.post("/", apiKeyGuard, async (req, res, next) => {
  try {
    const parsed = productSchema.parse({
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
    });

    const created = await productsCollection.add({
      ...parsed,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const snapshot = await created.get();
    res.status(201).json({ product: toProduct(snapshot) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/stock", apiKeyGuard, async (req, res, next) => {
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
});

export default router;
