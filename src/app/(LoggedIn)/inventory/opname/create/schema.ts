import * as z from "zod";

export const opnameSchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().optional(),
  items: z
    .array(
      z.object({
        bahanBakuId: z.string().min(1, "Bahan baku wajib dipilih"),
        stokFisik: z
          .string()
          .min(1, "Stok fisik wajib diisi")
          .refine((v) => Number(v) >= 0, "Stok fisik tidak boleh negatif"),
      }),
    )
    .min(1, "Minimal 1 bahan baku harus ditambahkan"),
});

export type OpnameFormData = z.infer<typeof opnameSchema>;
