import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(3),
  sku: z.string().min(2),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  category: z.enum(["lanas", "kits", "accesorios"]),
  image: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  notes: z.string().max(500).optional(),
});
