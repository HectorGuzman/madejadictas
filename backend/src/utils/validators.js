import { z } from "zod";

export const productSchema = z
  .object({
    title: z.string().min(3),
    sku: z.string().min(2),
    price: z.number().nonnegative(),
    stock: z.number().int().nonnegative(),
    category: z.enum(["lanas", "kits", "accesorios"]),
    image: z
      .string()
      .url()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    imageData: z.string().optional(), // data URL (image/jpeg|png|webp)
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.image && !data.imageData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imageData"],
        message: "Se requiere una imagen (archivo o URL)",
      });
    }
    if (data.imageData) {
      const ok = data.imageData.startsWith("data:image/");
      if (!ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["imageData"],
          message: "Formato de imagen inválido",
        });
      }
      if (data.imageData.length > 1_000_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["imageData"],
          message: "La imagen es muy pesada (máx ~1MB)",
        });
      }
    }
  });
