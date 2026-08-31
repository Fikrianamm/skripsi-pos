The application uses a layered configuration approach typical of Next.js, combining environment variables, TypeScript-based static configuration, and database-backed settings.

### 1. Environment Variables (`.env`)
Runtime secrets and infrastructure endpoints are managed via `.env` files, following the standard Next.js convention:
- **Database**: `DATABASE_URL` connects to a MySQL instance (configured in `docker-compose.yaml`).
- **Authentication**: `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` configure the `better-auth` library.
- **Storage**: `NEO_S3_*` variables configure Biznet Neo Object Storage for file uploads.
- **Real-time**: `PUSHER_*` and `NEXT_PUBLIC_PUSHER_*` variables configure Soketi (a self-hosted Pusher-compatible WebSocket server).
- **Public vs Private**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the client-side bundle, while others remain server-side only.

### 2. Static Configuration (`src/config/`)
Application-level constants and business rules are centralized in TypeScript modules:
- **`src/config/roles.ts`**: Defines the single source of truth for user roles (`admin`, `kasir`, `designer`, `produksi`, `gudang`). This file is imported by navigation, permissions, and API routes to ensure consistency.
- **`src/config/navigation.ts`**: Defines the sidebar structure (`NAV_ITEMS`), mapping routes to icons and restricting visibility based on roles defined in `roles.ts`.

### 3. Framework & Library Configuration
- **Next.js (`next.config.ts`)**: Configures React Compiler, standalone output for Docker, and external packages for native bindings (`@node-rs/argon2`).
- **Prisma (`prisma.config.ts`)**: Uses the new Prisma config format to define schema paths, migration directories, and seed scripts, pulling the database URL from `process.env`.
- **Auth (`src/lib/auth.ts`)**: Configures `better-auth` with Prisma adapter, custom password hashing (Argon2), and role-based access control (RBAC) plugins. It also enforces domain validation for sign-ups via hooks.
- **Permissions (`src/lib/permissions.ts`)**: Defines fine-grained access control statements (e.g., `pos:create`, `finance:view`) and maps them to the roles defined in `src/config/roles.ts`.

### 4. Infrastructure Configuration (`docker-compose.yaml`)
Local development infrastructure is orchestrated via Docker Compose, defining services for:
- **MySQL**: Persistent volume for data, exposed on port 3307.
- **phpMyAdmin**: Database management UI on port 8081.
- **Soketi**: WebSocket server for real-time features, configured via environment variables passed from the host `.env`.

### Developer Conventions
- **Add new roles**: Update `src/config/roles.ts` first, then define permissions in `src/lib/permissions.ts`, and finally update `src/config/navigation.ts` to control UI visibility.
- **Environment variables**: Always add new keys to `.env.example` with placeholder values. Use `NEXT_PUBLIC_` prefix only if the variable is needed in client components.
- **Secrets**: Never commit `.env`. Use `docker-compose` environment mapping for service-level configs like Soketi.