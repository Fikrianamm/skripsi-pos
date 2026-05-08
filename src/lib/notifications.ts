import { prisma } from "./prisma";
import { pusherServer } from "./pusher";
import { JenisNotif } from "../../generated/prisma/enums";

interface CreateNotifInput {
  userId: string;
  title: string;
  message: string;
  jenis: JenisNotif;
  linkUrl?: string;
}

/**
 * Creates a notification in the database and triggers a real-time event via Soketi.
 */
export async function createNotification(input: CreateNotifInput) {
  // 1. Create in database
  const notif = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      jenis: input.jenis,
      linkUrl: input.linkUrl,
    },
  });

  // 2. Trigger real-time event
  try {
    await pusherServer.trigger(
      `private-user-${input.userId}`,
      "new-notification",
      notif
    );
  } catch (error) {
    console.error("Failed to trigger socket event:", error);
  }

  return notif;
}

/**
 * Helper to send notifications to all users with a specific role.
 */
export async function createNotificationForRole(
  roleTarget: string[],
  input: Omit<CreateNotifInput, "userId">
) {
  const users = await prisma.user.findMany({ where: { role: { in: roleTarget } } });
  
  return Promise.all(
    users.map((user) =>
      createNotification({
        ...input,
        userId: user.id,
      })
    )
  );
}

/**
 * Helper to check if stock is low for a raw material and notify admins.
 * Anti-duplication logic: Only notifies once per 24 hours per material.
 */
export async function checkAndNotifyLowStock(bahanBakuId: string) {
  const bahan = await prisma.bahanBaku.findUnique({
    where: { id: bahanBakuId },
    select: { id: true, nama: true, stok: true, minStok: true },
  });

  if (!bahan || bahan.minStok === null) return;

  const currentStok = Number(bahan.stok);
  const minStok = Number(bahan.minStok);

  if (currentStok <= minStok) {
    // Check for recent notification (last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentNotif = await prisma.notification.findFirst({
      where: {
        jenis: JenisNotif.STOK_MENIPIS,
        message: { contains: bahan.nama },
        createdAt: { gte: last24h },
      },
    });

    if (!recentNotif) {
      await createNotificationForRole(["admin", "gudang"], {
        title: "Stok Menipis!",
        message: `Stok bahan "${bahan.nama}" saat ini ${currentStok}, segera lakukan pengisian (Min: ${minStok}).`,
        jenis: JenisNotif.STOK_MENIPIS,
        linkUrl: "/inventory/stock", // Path to stock list
      });
    }
  }
}

/**
 * Helper to notify relevant roles about an order status change.
 */
export async function notifyOrderStatusChange(
  orderId: string,
  nomorOrder: string,
  newStatus: string
) {
  try {
    await createNotificationForRole(
      ["admin", "kasir", "designer", "produksi", "gudang"],
      {
        title: "Update Status Pesanan",
        message: `Order #${nomorOrder} berubah status menjadi ${newStatus}.`,
        jenis: JenisNotif.STATUS_ORDER_UBAH,
        linkUrl: `/order/${orderId}`,
      }
    );
  } catch (error) {
    console.error("Failed to send order status notification:", error);
  }
}
