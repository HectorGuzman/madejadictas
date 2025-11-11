import { Router } from "express";
import { FieldValue, ordersCollection } from "../config/firestore.js";
import { orderSchema } from "../utils/validators.js";
import { verifyGoogle } from "../middleware/verifyGoogle.js";

const router = Router();

// Crear orden (público: guest o google). El backend valida estructura básica.
router.post("/", async (req, res, next) => {
  try {
    const parsed = orderSchema.parse({
      ...req.body,
      // fuerza números
      items: (req.body.items || []).map((it) => ({
        productId: String(it.productId || ""),
        quantity: Number(it.quantity || 0),
      })),
    });

    const docRef = await ordersCollection.add({
      ...parsed,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const snap = await docRef.get();
    res.status(201).json({ order: { id: snap.id, ...snap.data() } });
  } catch (error) {
    next(error);
  }
});

// Listar órdenes (sólo equipo autenticado)
router.get("/", verifyGoogle, async (req, res, next) => {
  try {
    const snapshot = await ordersCollection.orderBy("createdAt", "desc").limit(50).get();
    const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

export default router;

