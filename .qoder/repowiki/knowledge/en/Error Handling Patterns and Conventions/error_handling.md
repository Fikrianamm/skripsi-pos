## Overview

This Next.js application uses a **layered error handling approach** combining framework-level error boundaries, API route try-catch blocks, server action error objects, and Zod schema validation. There is no centralized error type system or custom error classes; instead, errors are handled pragmatically at each layer with user-friendly Indonesian messages.

---

## 1. Client-Side Error Boundaries (Next.js App Router)

The application leverages Next.js built-in error boundary files:

- **`src/app/error.tsx`** — Global error boundary for unexpected runtime errors. Logs to `console.error`, displays a styled error page with "Coba Lagi" (retry) and navigation options.
- **`src/app/not-found.tsx`** — Handles 404 cases with a branded UI.
- **`src/app/forbidden.tsx`** — Handles 403 access-denied scenarios.
- **`src/app/unauthorized.tsx`** — Handles 401 authentication failures, redirects users to login.
- **`src/app/api/auth/error/page.tsx`** — Auth-specific error handler that decodes error query params and redirects to `/auth/login?authError=...`.

All error pages are client components (`"use client"`) using HeroUI components and Lucide icons for consistent visual presentation.

---

## 2. API Route Error Handling Pattern

Every API route follows a **consistent try-catch + guard function pattern**:

### Authentication/Authorization Guard
Routes define a local `requireAccess()` or `requireOrderAccess()` async function that:
1. Calls `auth.api.getSession()` from better-auth
2. Returns `{ error, status, session }` tuples
3. Checks role-based permissions against allowed arrays (e.g., `["admin", "kasir"]`)

Example from `src/app/api/order/route.ts`:
```typescript
async function requireOrderAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { error: "Unauthorized. Silakan login terlebih dahulu.", status: 401, session: null };
  const ALLOWED = ["admin", "kasir", "designer", "produksi", "gudang"];
  if (!session.user.role || !ALLOWED.includes(session.user.role)) {
    return { error: "Forbidden. Anda tidak memiliki akses.", status: 403, session: null };
  }
  return { error: null, status: 200, session };
}
```

### Request Handler Structure
Each HTTP method handler wraps logic in try-catch:
```typescript
export async function POST(request: NextRequest) {
  try {
    const { error, status, session } = await requireOrderAccess();
    if (error || !session) return NextResponse.json({ error }, { status });
    
    // Validation checks returning 400 errors
    if (!customerId) {
      return NextResponse.json({ error: "Customer wajib dipilih." }, { status: 400 });
    }
    
    // Business logic...
    return NextResponse.json({ message: "...", data }, { status: 201 });
  } catch (error) {
    console.error("[ORDER CREATE ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
```

**Key conventions:**
- All errors logged with bracketed tags like `[ORDER CREATE ERROR]` for log filtering
- Generic "Terjadi kesalahan internal server" message returned to clients (no error details leaked)
- Validation errors include specific field-level messages
- HTTP status codes: 400 (validation), 401 (unauthenticated), 403 (forbidden), 404 (not found), 500 (internal)

---

## 3. Server Action Error Handling

Server actions in `src/actions/` use a **simple object-return pattern**:

From `src/actions/sign-in-email.action.ts`:
```typescript
export async function signInEmailAction(formData: FormData) {
  // Early validation returns
  if (!email) return { error: "Masukkan email Anda" };
  
  try {
    // Auth logic...
    return { error: null }; // Success
  } catch (err) {
    console.error("Sign In Error:", err);
    
    if (err instanceof APIError) {
      // Map Better-Auth error codes to user-friendly messages
      if (errorCode === "TOO_MANY_REQUESTS") {
        return { error: "Terlalu banyak percobaan login..." };
      }
      return { error: err.message || "Gagal login..." };
    }
    
    return { error: "Terjadi kesalahan server..." };
  }
}
```

**Pattern characteristics:**
- Return `{ error: string | null }` objects (never throw)
- Check `err instanceof APIError` from better-auth for typed error handling
- Map external library error codes to localized Indonesian messages
- Log raw errors via `console.error` for debugging

---

## 4. Input Validation with Zod Schemas

Validation schemas live in `src/lib/schemas/`:

- **`auth.ts`** — `registerSchema`, `loginSchema` for form validation
- **`product.ts`** — `createProductSchema`, `editProductSchema` with conditional validation via `superRefine`
- **`admin.ts`** — Admin-specific schemas

Example with cross-field validation:
```typescript
export const createProductSchema = z.object({...})
  .superRefine((data, ctx) => {
    if (!data.isService) {
      if (data.stok === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stok wajib diisi", path: ["stok"] });
      }
    }
  });
```

**Note:** Schemas are defined but **not consistently used** in API routes. Most routes perform manual validation checks inline rather than calling `schema.parse()` or `schema.safeParse()`. This represents a gap between schema definition and enforcement.

---

## 5. Middleware Error Handling

`src/proxy.ts` handles authentication routing but **does not throw errors**. Instead:
- Redirects unauthenticated users to `/auth/login?unauthorized=true`
- Redirects authenticated users away from guest routes to `/dashboard`
- Skips API routes and static files entirely (`NextResponse.next()`)

No error responses are generated at the middleware level; all error handling is deferred to route handlers or error pages.

---

## 6. Transaction Error Handling

Database transactions use Prisma's `$transaction` with explicit error throwing:
```typescript
const order = await prisma.$transaction(async (tx) => {
  // ... operations
  if (!kasBank || !kasBank.akunId) {
    throw new Error("Rekening Kas/Bank tujuan tidak valid.");
  }
  // ...
});
```

Thrown errors bubble up to the outer try-catch block, which logs and returns a 500 response.

---

## Developer Rules & Conventions

1. **Never expose raw error details** to API consumers — always return generic Indonesian messages for 500 errors
2. **Always log errors** with bracketed context tags: `console.error("[ROUTE_NAME ACTION]", error)`
3. **Use guard functions** for auth checks — return `{ error, status, session }` tuples, don't throw
4. **Return structured error objects** from server actions: `{ error: string | null }`
5. **Validate input early** — return 400 responses with specific field-level messages before business logic
6. **Use Zod schemas** for form validation (defined in `src/lib/schemas/`), though API routes currently use manual checks
7. **Handle Better-Auth APIError instances** specifically — map error codes to localized messages
8. **All error UI pages** must be client components with consistent HeroUI styling and Lucide icons
9. **HTTP status codes**: 400 (validation), 401 (unauthenticated), 403 (forbidden), 404 (not found), 500 (internal)
10. **Transaction errors** should throw descriptive Error objects that get caught by outer try-catch blocks
