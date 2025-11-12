import { z } from "zod";

export const productSchema = z
  .object({
    title: z.string().min(3),
    sku: z.string().min(2).optional(),
    price: z.number().nonnegative(),
    stock: z.number().int().nonnegative(),
    category: z.enum(["hilados", "accesorios"]),
    image: z
      .string()
      .url()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    imageData: z.string().optional(), // data URL (image/jpeg|png|webp)
    // Campos específicos de hilados
    thickness: z.string().optional(),
    composition: z.string().optional(),
    lengthWeight: z.string().optional(),
    // Tags puede llegar como string o array
    tags: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((v) => {
        if (!v) return undefined;
        if (Array.isArray(v)) return v.filter(Boolean);
        return v
          .split(/\s+/)
          .map((s) => s.trim())
          .filter(Boolean);
      }),
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
      if (data.imageData.length > 1_500_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["imageData"],
          message: "La imagen es muy pesada (máx ~1.5MB)",
        });
      }
    }
    if (data.category === "hilados") {
      if (!data.thickness) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["thickness"], message: "Grosor es requerido" });
      }
      if (!data.composition) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["composition"], message: "Composición es requerida" });
      }
      if (!data.lengthWeight) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lengthWeight"], message: "Metros/gramos es requerido" });
      }
    }
  });

export const orderSchema = z
  .object({
    customer: z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      region: z.string().optional(),
      address: z.string().min(4),
      city: z.string().optional(),
      notes: z.string().max(1000).optional(),
    }),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
    channel: z.enum(["guest", "google"]).default("guest"),
    contactEmail: z.string().email().optional(),
    contactName: z.string().optional(),
  })
  .refine((data) => data.customer?.fullName && data.customer?.address, {
    message: "Datos de cliente incompletos",
    path: ["customer"],
  });

export const showroomSchema = z
  .object({
    title: z.string().min(3),
    date: z.string().min(4), // ISO sugerido, pero aceptamos string descriptivo
    location: z.string().min(3),
    photos: z.array(z.string()).min(1).max(10), // dataURLs
    description: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    // Validar que cada foto sea dataURL y tamaño razonable (~150 KB)
    const maxLen = 200_000; // ~150KB a 200KB aprox según base64
    data.photos.forEach((p, i) => {
      const ok = typeof p === "string" && p.startsWith("data:image/");
      if (!ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["photos", i], message: "Formato de imagen inválido" });
      } else if (p.length > maxLen) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["photos", i], message: "Imagen demasiado pesada" });
      }
    });
  });
