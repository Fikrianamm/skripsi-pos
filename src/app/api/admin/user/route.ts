import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/argon2";
import { normalizeName, VALID_DOMAINS } from "@/lib/func";
import { getRandomAvatar } from "@/lib/avatar-helper";
import { ROLE_KEYS } from "@/config/roles";

// GET /api/admin/user — List users
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses admin." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const skip = (page - 1) * limit;

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

// POST /api/admin/user — Create user
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Anda tidak memiliki akses admin." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Field name, email, dan password wajib diisi." },
        { status: 400 },
      );
    }

    const allowedRoles: string[] = [...ROLE_KEYS];
    const userRole = role && allowedRoles.includes(role) ? role : "kasir";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 },
      );
    }

    const domain = email.split("@")[1];
    if (!VALID_DOMAINS().includes(domain)) {
      return NextResponse.json(
        { error: "Domain email tidak diizinkan. Gunakan email yang valid." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 400 },
      );
    }

    const normalizedName = normalizeName(name);
    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        name: normalizedName,
        email,
        emailVerified: false,
        image: getRandomAvatar(),
        role: userRole,
        accounts: {
          create: {
            id: accountId,
            accountId: userId,
            providerId: "credential",
            password: hashedPassword,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "User berhasil dibuat.",
        user: newUser,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ADMIN CREATE USER ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 },
    );
  }
}
