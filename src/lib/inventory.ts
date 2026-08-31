import { prisma } from "./prisma";

export async function autoDeductBOM(orderId: string, spkId?: string, userId?: string) {
  // Cek apakah sudah pernah dipotong secara otomatis
  const orderInfo = await prisma.order.findUnique({ where: { id: orderId }, select: { nomorOrder: true } });
  if (!orderInfo) return;

  const existing = await prisma.pengeluaranBarang.findFirst({
    where: {
      OR: [
        ...(spkId ? [{ spkId }] : []),
        { keterangan: { contains: `[AUTO-BOM] Order: ${orderInfo.nomorOrder}` } }
      ]
    }
  });

  if (existing) return; // Sudah dipotong

  // Ambil order beserta item dan resep BOM produk atau kebutuhan bahan custom
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: { bahanBakuList: true }
          },
          kebutuhanBahanCustom: true
        }
      }
    }
  });

  if (!order || !order.items || order.items.length === 0) return;

  // Hitung total kebutuhan bahan baku
  const requiredMaterials: Record<string, number> = {};
  for (const item of order.items) {
    const isCustom = item.product?.isService;
    if (isCustom) {
      // Ambil dari kebutuhanBahanCustom
      if (item.kebutuhanBahanCustom && item.kebutuhanBahanCustom.length > 0) {
        for (const kbc of item.kebutuhanBahanCustom) {
          const needed = Number(kbc.jumlahDibutuhkan);
          requiredMaterials[kbc.bahanBakuId] = (requiredMaterials[kbc.bahanBakuId] || 0) + needed;
        }
      }
    } else {
      // Produk standar: ambil dari bahanBakuList
      if (item.product && item.product.bahanBakuList) {
        const qty = Number(item.qty);
        for (const bom of item.product.bahanBakuList) {
          const needed = Number(bom.jumlahButuh) * qty;
          requiredMaterials[bom.bahanBakuId] = (requiredMaterials[bom.bahanBakuId] || 0) + needed;
        }
      }
    }
  }

  const materials = Object.entries(requiredMaterials);
  if (materials.length === 0) return;

  // Eksekusi potong stok dan catat barang keluar dalam atomic transaction
  const pengeluaranId = crypto.randomUUID();
  
  await prisma.$transaction([
    prisma.pengeluaranBarang.create({
      data: {
        id: pengeluaranId,
        spkId: spkId || null,
        keterangan: `[AUTO-BOM] Order: ${order.nomorOrder} - Pemotongan otomatis stok bahan baku`,
        addedById: userId || null,
        tanggal: new Date(),
        items: {
          create: materials.map(([bahanBakuId, jumlah]) => ({
            id: crypto.randomUUID(),
            bahanBakuId,
            jumlah,
          }))
        }
      }
    }),
    ...materials.map(([bahanBakuId, jumlah]) => 
      prisma.bahanBaku.update({
        where: { id: bahanBakuId },
        data: { stok: { decrement: jumlah } }
      })
    )
  ]);
}

export async function checkBOMAvailability(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              bahanBakuList: {
                include: { bahanBaku: true },
              },
            },
          },
          kebutuhanBahanCustom: {
            include: { bahanBaku: true },
          },
        },
      },
    },
  });

  if (!order || !order.items || order.items.length === 0) {
    return { isAvailable: true, missingMaterials: [], orderInfo: order };
  }

  const requiredMaterials: Record<
    string,
    { needed: number; nama: string; currentStok: number }
  > = {};

  for (const item of order.items) {
    const isCustom = item.product?.isService;
    if (isCustom) {
      if (item.kebutuhanBahanCustom && item.kebutuhanBahanCustom.length > 0) {
        for (const kbc of item.kebutuhanBahanCustom) {
          const needed = Number(kbc.jumlahDibutuhkan);
          const bbId = kbc.bahanBakuId;

          if (!requiredMaterials[bbId]) {
            requiredMaterials[bbId] = {
              needed: 0,
              nama: kbc.bahanBaku.nama,
              currentStok: Number(kbc.bahanBaku.stok),
            };
          }
          requiredMaterials[bbId].needed += needed;
        }
      }
    } else {
      if (item.product && item.product.bahanBakuList) {
        const qty = Number(item.qty);
        for (const bom of item.product.bahanBakuList) {
          const needed = Number(bom.jumlahButuh) * qty;
          const bbId = bom.bahanBakuId;

          if (!requiredMaterials[bbId]) {
            requiredMaterials[bbId] = {
              needed: 0,
              nama: bom.bahanBaku.nama,
              currentStok: Number(bom.bahanBaku.stok),
            };
          }
          requiredMaterials[bbId].needed += needed;
        }
      }
    }
  }

  const missingMaterials = [];
  for (const [id, data] of Object.entries(requiredMaterials)) {
    if (data.currentStok < data.needed) {
      missingMaterials.push({
        nama: data.nama,
        needed: data.needed,
        currentStok: data.currentStok,
        shortage: data.needed - data.currentStok,
      });
    }
  }

  return {
    isAvailable: missingMaterials.length === 0,
    missingMaterials,
    orderInfo: order,
  };
}
