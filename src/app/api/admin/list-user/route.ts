import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // ============================================
    // Middleware 1: Harus login (session validation)
    // ============================================
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    // ============================================
    // Middleware 2: Harus memiliki role admin
    // (di-comment terlebih dahulu sesuai permintaan)
    // ============================================
    // if (session.user.role !== "admin") {
    //   return NextResponse.json(
    //     { error: "Forbidden. Anda tidak memiliki akses admin." },
    //     { status: 403 },
    //   );
    // }

    // ============================================
    // Query parameters
    // ============================================
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const skip = (page - 1) * limit;

    // ============================================
    // Build filter
    // ============================================
    const where: Record<string, unknown> = {
      id: { not: session.user.id },
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role && role !== "all") {
      const roles = role.split(",");
      if (roles.length === 1) {
        where.role = roles[0];
      } else {
        where.role = { in: roles };
      }
    }

    // ============================================
    // Get users + count
    // ============================================
    const [results, count] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          banned: true,
          createdAt: true,
          accounts: {
            select: {
              providerId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      results,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("[ADMIN LIST USER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
