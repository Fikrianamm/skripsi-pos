import * as z from "zod";

export const pengeluaranSchema = z.object({
  spkId: z.string().optional(),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().optional(),
  items: z
    .array(
      z.object({
        bahanBakuId: z.string().min(1, "Bahan baku wajib dipilih"),
        jumlah: z
          .string()
          .min(1, "Jumlah wajib diisi")
          .refine((v) => Number(v) > 0, "Jumlah harus lebih dari 0"),
      }),
    )
    .min(1, "Minimal 1 bahan baku harus ditambahkan"),
});

export type PengeluaranFormData = z.infer<typeof pengeluaranSchema>;
