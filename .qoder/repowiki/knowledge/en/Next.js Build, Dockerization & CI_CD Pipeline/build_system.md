The project utilizes a modern JavaScript-based build and deployment ecosystem centered around **Next.js 16**, **Prisma ORM**, and **Docker**. The build process is orchestrated via `npm` scripts, with a multi-stage Dockerfile optimized for production efficiency using Next.js's `standalone` output mode. Continuous Integration (CI) and Continuous Deployment (CD) are managed through GitHub Actions, automating testing, linting, and VPS deployment.

### 1. Build System & Tooling
- **Framework**: Next.js 16 (App Router) with React 19.
- **Package Manager**: `npm` (indicated by `package-lock.json` and `npm ci` in CI).
- **Database ORM**: Prisma 7. The build script (`npm run build`) explicitly runs `prisma generate` and `prisma migrate deploy` before the Next.js build to ensure the database schema and client are synchronized.
- **Testing**: Vitest is used for unit/integration tests, triggered via `npm run test`.
- **Linting**: ESLint 9 is configured for code quality checks.

### 2. Containerization Strategy
- **Multi-Stage Docker Build**: The `Dockerfile` employs a three-stage build process:
  1. **deps**: Installs dependencies based on the lockfile.
  2. **builder**: Compiles the Next.js application. It leverages `output: "standalone"` from `next.config.ts` to create a minimal server artifact.
  3. **runner**: A lightweight `node:20-alpine` image that copies only the necessary standalone server files and static assets, significantly reducing the final image size.
- **Local Development Environment**: `docker-compose.yaml` provisions a local development stack including:
  - **MySQL 8.0**: Primary database.
  - **phpMyAdmin**: Database management UI.
  - **Soketi**: A self-hosted Pusher-compatible WebSocket server for real-time features.

### 3. CI/CD Pipelines
- **CI (`.github/workflows/ci.yml`)**: Triggered on push/PR to `main`/`master`.
  - Spins up a MySQL service container.
  - Installs dependencies, generates Prisma client, runs linter, executes Vitest tests, and builds the application.
  - Uses cached npm dependencies for speed.
- **CD (`.github/workflows/deploy.yml`)**: Triggered on push to `main`/`master`.
  - Deploys to a VPS via SSH using `appleboy/ssh-action`.
  - Executes a remote script to pull changes, install dependencies, run database migrations, rebuild the app, and restart the PM2 process manager.

### 4. Developer Conventions
- **Build Command**: `npm run build` is the single entry point for production preparation, handling both DB migrations and app compilation.
- **Environment Variables**: Critical secrets (DB URL, Auth Secrets, Pusher keys) are managed via GitHub Secrets for CI/CD and `.env` files for local development.
- **Standalone Output**: Developers should rely on the `.next/standalone` directory for production deployments, as configured in `next.config.ts`.