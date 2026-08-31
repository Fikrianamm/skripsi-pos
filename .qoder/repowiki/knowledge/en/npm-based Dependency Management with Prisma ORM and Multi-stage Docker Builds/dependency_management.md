## Overview

This Next.js-based ERP application uses **npm** as its primary package manager with `package-lock.json` (lockfileVersion 3) for deterministic dependency resolution. The project follows standard Node.js/TypeScript conventions with no vendoring strategy — all dependencies are fetched from the public npm registry.

## Package Manager & Lockfile Strategy

- **Package manager**: npm (via `package.json` and `package-lock.json`)
- **Lockfile version**: 3 (modern npm format, supports workspaces and improved peer dependency handling)
- **Install command in CI**: `npm ci` — enforces strict lockfile adherence, fails if lockfile is out of sync
- **No private registries**: All dependencies resolve to `https://registry.npmjs.org/`
- **No GOPRIVATE or vendor directories**: This is a pure JavaScript/TypeScript project; Go tooling does not apply

## Key Dependency Categories

### Core Framework Dependencies
- `next@16.0.5` — pinned exact version for framework stability
- `react@19.2.0`, `react-dom@19.2.0` — pinned exact versions matching Next.js requirements
- `typescript@^5` — caret range allowing minor/patch updates

### UI Component Libraries
- `@heroui/*` — HeroUI component suite (multiple scoped packages at `^2.x` ranges)
- `@radix-ui/*` — Radix UI primitives (headless accessible components)
- `lucide-react@^0.562.0`, `react-icons@^5.5.0` — icon libraries
- `recharts@^3.8.1` — charting library for financial reports

### Database & ORM
- `@prisma/client@^7.4.0` — generated Prisma client for type-safe database access
- `prisma@^7.4.0` (devDependency) — CLI tool for migrations and schema generation
- `@prisma/adapter-mariadb@^7.2.0` — MariaDB/MySQL adapter for Prisma
- `prisma-erd-generator@^2.4.2` (devDependency) — auto-generates ER diagrams from schema

The Prisma schema (`prisma/schema.prisma`) defines the complete data model including auth (User, Session, Account), inventory (Product, BahanBaku, StokMasuk/StokKeluar), orders (Order, OrderItem, SPK), and finance (Akun, JurnalUmum, KasBank, Payment). Binary targets include both `native` and `linux-musl-openssl-3.0.x` for cross-platform compatibility.

### Authentication
- `better-auth@^1.4.3` — modern authentication library
- `@node-rs/argon2@^2.0.2` — native Argon2 password hashing (listed in `serverExternalPackages` in `next.config.ts` to prevent bundling issues)

### State Management & Data Fetching
- `zustand@^5.0.8` — lightweight state management
- `swr@^2.4.0` — React Hooks for data fetching with caching
- `react-hook-form@^7.67.0` + `@hookform/resolvers@^5.2.2` + `zod@^4.1.13` — form handling with schema validation

### Infrastructure & Services
- `@aws-sdk/*@^3.1001.0` — AWS S3 client libraries for file storage
- `pusher@^5.3.3`, `pusher-js@^8.5.0` — real-time WebSocket messaging (compatible with self-hosted Soketi via docker-compose)

### Dev Tooling
- `vitest@^4.1.5` + `@testing-library/react@^16.3.2` — unit and integration testing
- `eslint@^9` + `eslint-config-next@16.0.5` — linting aligned with Next.js best practices
- `tsx@^4.20.6` — TypeScript execution engine for seed scripts
- `puppeteer@^24.43.1` + `@mermaid-js/mermaid-cli@^11.15.0` — diagram generation from PlantUML/Mermaid sources

## Build & Deployment Pipeline

### Build Script Chain
```json
"build": "prisma generate && prisma migrate deploy && next build"
```
The build process ensures:
1. Prisma client is regenerated from the latest schema
2. Database migrations are applied before building
3. Next.js production build is created

### Docker Multi-stage Build
The `Dockerfile` uses a three-stage build pattern:
1. **deps stage**: Installs dependencies using `npm install` (falls back through yarn/pnpm detection)
2. **builder stage**: Runs `npm run build` to produce the standalone output
3. **runner stage**: Minimal Alpine-based image running as non-root `nextjs` user, copying only `.next/standalone` output

Key configuration:
- `next.config.ts` sets `output: "standalone"` for optimized Docker deployments
- `serverExternalPackages: ["@node-rs/argon2"]` prevents bundling of native Argon2 module
- Base image: `node:20-alpine` with `libc6-compat` for native module compatibility

### CI Workflow (`.github/workflows/ci.yml`)
- Uses `actions/setup-node@v4` with `cache: 'npm'` for dependency caching
- Runs `npm ci` for reproducible installs
- Executes lint, tests, and build steps with environment variables injected
- MySQL 8.0 service container provided for integration tests

## Path Aliases & Module Resolution

`tsconfig.json` configures:
- `moduleResolution: "bundler"` — modern resolution strategy compatible with Next.js
- Path alias `@/*` → `./src/*` for clean imports
- `skipLibCheck: true` — skips type-checking of declaration files for faster builds
- Generated Prisma types included via `generated/**/*.ts` in the `include` array

## Conventions for Developers

1. **Always commit `package-lock.json`**: Ensures deterministic installs across environments
2. **Use `npm ci` in CI/CD**: Never use `npm install` in automated pipelines
3. **Prisma workflow**: After schema changes, run `npx prisma generate` locally before committing
4. **Seed scripts**: Located in `prisma/seed*.ts`, executed via `npm run seed` (uses `tsx`)
5. **No manual node_modules edits**: All dependency changes must go through `npm install <pkg>`
6. **Native modules**: `@node-rs/argon2` requires `libc6-compat` in Alpine-based Docker images
7. **Environment variables**: Required at build time for Prisma (`DATABASE_URL`) and runtime for Pusher/Soketi configuration
