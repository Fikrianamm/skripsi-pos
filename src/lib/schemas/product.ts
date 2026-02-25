import { z } from "zod";

/**
 * Schema for admin create/edit user form validation
 */
export const createProductSchema = z
  .object({
    nama: z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(50, "Nama maksimal 50 karakter"),
    categoryId: z.string().min(1, "Kategori wajib diisi"),
    unitId: z.string().min(1, "Satuan wajib diisi"),
    sku: z.string().min(1, "SKU wajib diisi"),
    hpp: z.number().optional(),
    hargaJual: z.number().min(1, "Harga wajib diisi"),
    // optional di level field, wajib dikondisikan via superRefine di bawah
    stok: z.number().min(0).optional(),
    minStok: z.number().min(0).optional(),
    isService: z.boolean().optional(),
    image: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Jika bukan jasa (produk fisik), stok dan minStok wajib diisi > 0
    if (!data.isService) {
      if (data.stok === undefined || data.stok === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stok wajib diisi",
          path: ["stok"],
        });
      } else if (data.stok < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stok minimal 1",
          path: ["stok"],
        });
      }
      if (data.minStok === undefined || data.minStok === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stok minimal wajib diisi",
          path: ["minStok"],
        });
      } else if (data.minStok < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stok minimal harus ≥ 1",
          path: ["minStok"],
        });
      }
    }
  });

export const editProductSchema = z.object({
  nama: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter")
    .optional(),
  categoryId: z.string().min(1, "Kategori wajib diisi").optional(),
  unitId: z.string().min(1, "Satuan wajib diisi").optional(),
  sku: z.string().min(1, "SKU wajib diisi").optional(),
  hpp: z.number().optional(),
  hargaJual: z.number().min(1, "Harga wajib diisi").optional(),
  stok: z.number().min(1, "Stok wajib diisi").optional(),
  minStok: z.number().min(1, "Stok minimal wajib diisi").optional(),
  isService: z.boolean().optional(),
  image: z.string().optional(),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type EditProductFormData = z.infer<typeof editProductSchema>;
