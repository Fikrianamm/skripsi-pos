# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [Dockerfile](file://Dockerfile)
- [docker-compose.yaml](file://docker-compose.yaml)
- [prisma.config.ts](file://prisma.config.ts)
- [prisma/schema.prisma](file://prisma/schema.prisma)
- [prisma/seed.ts](file://prisma/seed.ts)
- [src/lib/prisma.ts](file://src/lib/prisma.ts)
- [src/lib/auth.ts](file://src/lib/auth.ts)
- [src/lib/storage.ts](file://src/lib/storage.ts)
- [src/lib/pusher.ts](file://src/lib/pusher.ts)
- [next.config.ts](file://next.config.ts)
- [src/app/layout.tsx](file://src/app/layout.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Installation Overview](#installation-overview)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Environment Configuration](#environment-configuration)
6. [Database Migration and Seeding](#database-migration-and-seeding)
7. [Local Development Server](#local-development-server)
8. [Docker Deployment](#docker-deployment)
9. [Initial Validation Checklist](#initial-validation-checklist)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Architecture Overview](#architecture-overview)
12. [Conclusion](#conclusion)

## Introduction
This guide helps you set up the Point of Sale (POS) and Production Management System from cloning the repository to running it locally. It covers prerequisites, environment variables, database setup, seeding, local development, and Docker deployment. The system integrates Next.js 16, Prisma ORM, Better Auth, real-time notifications via Pusher/Soketi, and cloud storage compatible with S3 (Neo Object Storage).

## System Requirements
- Node.js 18.x or higher
- MySQL 8.0 or higher
- S3-compatible bucket (Neo Object Storage recommended)
- Git for cloning the repository

These requirements are confirmed by the project’s documentation and configuration.

**Section sources**
- [README.md:31-35](file://README.md#L31-L35)

## Installation Overview
The setup consists of:
- Cloning the repository
- Installing dependencies
- Configuring environment variables
- Running database migrations and seeding
- Starting the development server
- Optional: Running with Docker

```mermaid
flowchart TD
A["Clone repository"] --> B["Install dependencies"]
B --> C["Configure .env"]
C --> D["Run migrations"]
D --> E["Seed database"]
E --> F["Start dev server"]
F --> G["Open application in browser"]
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

## Step-by-Step Setup
Follow these steps to prepare the project:

1. **Clone the repository**
   - Use your preferred Git client to clone the repository and navigate into the project folder.

2. **Install dependencies**
   - Run the package manager install script defined in the project.

3. **Create and configure .env**
   - Copy the example environment file and fill in database, auth, S3, and Pusher variables.

4. **Generate Better Auth secret**
   - Use the OpenSSL command shown in the documentation to generate a secure secret and paste it into .env.

5. **Run migrations and seed**
   - Apply Prisma migrations and seed the database using the scripts defined in the project.

6. **Start the development server**
   - Launch the Next.js development server using the configured script.

**Section sources**
- [README.md:37-61](file://README.md#L37-L61)
- [package.json:6](file://package.json#L6-L12)

## Environment Configuration
Create a .env file by copying the example and set the following variables:

- DATABASE
  - DATABASE_URL: MySQL connection string (format: mysql://user:password@host:port/dbname)

- AUTH
  - BETTER_AUTH_SECRET: Generated secret
  - BETTER_AUTH_URL: Application URL (e.g., http://localhost:3000)

- S3 (Neo Object Storage)
  - NEO_S3_ACCESS_KEY: Access key from Neo portal
  - NEO_S3_SECRET_KEY: Secret key from Neo portal
  - NEO_S3_BUCKET: Name of the bucket
  - NEO_S3_ENDPOINT: Endpoint hostname (without protocol)
  - NEO_S3_PUBLIC_URL: Public base URL for assets

- Real-time (Pusher/Soketi)
  - PUSHER_APP_ID: Application ID
  - PUSHER_SECRET: Application secret
  - NEXT_PUBLIC_PUSHER_KEY: Application key
  - NEXT_PUBLIC_PUSHER_HOST: Host (e.g., localhost)
  - NEXT_PUBLIC_PUSHER_PORT: Port (e.g., 6001)
  - NEXT_PUBLIC_PUSHER_SCHEME: Scheme (http or https)

Notes:
- The application reads environment variables at runtime and uses them to connect to MySQL, S3, and Pusher.
- The S3 client extracts region from the endpoint and constructs URLs automatically.

**Section sources**
- [README.md:73-98](file://README.md#L73-L98)
- [src/lib/storage.ts:11-16](file://src/lib/storage.ts#L11-L16)
- [src/lib/storage.ts:19-30](file://src/lib/storage.ts#L19-L30)
- [src/lib/pusher.ts:3-10](file://src/lib/pusher.ts#L3-L10)
- [src/lib/prisma.ts:9-18](file://src/lib/prisma.ts#L9-L18)

## Database Migration and Seeding
The project uses Prisma for schema management and seeding. The migration and seed commands are integrated into the project scripts.

- Migration
  - The project runs Prisma migrations during the build step and also supports manual migration commands.

- Seeding
  - The seed script creates default users, finance data, products, dummy entries, transactions, and application settings.

- Prisma configuration
  - The Prisma config defines the schema location, migration path, and seed command.

- Schema overview
  - The schema defines models for users, orders, inventory, finance, and notifications, among others.

**Section sources**
- [package.json:8](file://package.json#L8)
- [package.json:11](file://package.json#L11)
- [prisma.config.ts:4-12](file://prisma.config.ts#L4-L12)
- [prisma/seed.ts:8-126](file://prisma/seed.ts#L8-L126)
- [prisma/schema.prisma:15-675](file://prisma/schema.prisma#L15-L675)

## Local Development Server
Start the development server using the configured script. The Next.js configuration enables React Compiler and sets the output mode to standalone for optimized builds.

- Development server
  - Use the dev script to start the Next.js development server.

- Build and start
  - The build script generates Prisma clients, applies migrations, and compiles the application.

- Standalone output
  - The Next.js configuration sets output to standalone, which is compatible with the Docker setup.

**Section sources**
- [package.json:7](file://package.json#L7)
- [package.json:8](file://package.json#L8)
- [next.config.ts:3-8](file://next.config.ts#L3-L8)

## Docker Deployment
The project includes a multi-stage Dockerfile and a docker-compose configuration for local deployment.

- Dockerfile
  - Multi-stage build: installs dependencies, builds the Next.js app, and runs it in a minimal Alpine Linux container.
  - Exposes port 3000 and sets environment variables for hostname and port.

- docker-compose
  - Provides three services:
    - MySQL 8.0 with persistent volume and exposed port
    - phpMyAdmin for database administration
    - Soketi (self-hosted Pusher-compatible server) with configurable app credentials

- Running containers
  - Bring up the stack with the compose file and access the application on port 3000.

- Environment variables for Docker
  - Configure PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, and PUSHER_SECRET in your environment so that Soketi picks them up.

**Section sources**
- [Dockerfile:1-64](file://Dockerfile#L1-L64)
- [docker-compose.yaml:1-47](file://docker-compose.yaml#L1-L47)

## Initial Validation Checklist
After completing setup, verify the following:

- Dependencies installed
  - Confirm that node_modules exists and no dependency errors occur during install.

- Environment variables present
  - Ensure DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, S3 keys, and Pusher keys are set.

- Database connectivity
  - Verify that the application can connect to MySQL using the DATABASE_URL.

- Migrations applied
  - Confirm that Prisma migrations have been executed and the database schema matches the Prisma schema.

- Seeding completed
  - Check that default users, settings, and sample data are present in the database.

- Development server running
  - Open the application in a browser and log in using seeded credentials.

- Real-time notifications
  - Confirm that Pusher/Soketi is reachable and channels are functioning.

- Cloud storage uploads
  - Attempt an asset upload to verify S3 compatibility and permissions.

**Section sources**
- [README.md:37-61](file://README.md#L37-L61)
- [prisma/seed.ts:68-98](file://prisma/seed.ts#L68-L98)
- [src/lib/storage.ts:32-40](file://src/lib/storage.ts#L32-L40)
- [src/lib/pusher.ts:3-10](file://src/lib/pusher.ts#L3-L10)

## Troubleshooting Guide
Common issues and resolutions:

- Node.js version mismatch
  - Ensure Node.js 18.x or later is installed. Lower versions may cause build failures.

- MySQL connection errors
  - Verify DATABASE_URL format and that the MySQL service is running. Confirm credentials and network accessibility.

- Prisma migration failures
  - Review migration logs and ensure the database is reachable. Re-run migrations if needed.

- Authentication secret missing
  - Generate and set BETTER_AUTH_SECRET using the OpenSSL command. Without it, Better Auth will fail.

- S3 upload failures
  - Confirm NEO_S3_ACCESS_KEY, NEO_S3_SECRET_KEY, NEO_S3_BUCKET, and NEO_S3_ENDPOINT are correct. Test endpoint reachability.

- Pusher/Soketi connectivity
  - Ensure PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, host, port, and scheme match the Soketi configuration.

- Docker build errors
  - Use the provided Dockerfile and docker-compose files. Ensure environment variables are exported before building.

- Next.js compilation warnings
  - The configuration enables React Compiler and standalone output. Address any warnings reported by the build process.

**Section sources**
- [README.md:31-35](file://README.md#L31-L35)
- [README.md:51-53](file://README.md#L51-L53)
- [src/lib/prisma.ts:9-18](file://src/lib/prisma.ts#L9-L18)
- [src/lib/storage.ts:11-16](file://src/lib/storage.ts#L11-L16)
- [src/lib/pusher.ts:3-10](file://src/lib/pusher.ts#L3-L10)
- [Dockerfile:1-64](file://Dockerfile#L1-L64)
- [docker-compose.yaml:30-43](file://docker-compose.yaml#L30-L43)

## Architecture Overview
High-level architecture showing how components interact during development and deployment.

```mermaid
graph TB
subgraph "Application"
Web["Next.js App<br/>Routes, Pages, API"]
Auth["Better Auth<br/>RBAC & Sessions"]
DB["Prisma Client<br/>MySQL Adapter"]
S3["AWS S3 Client<br/>Neo Object Storage"]
Pusher["Pusher/Soketi<br/>Real-time Channels"]
end
subgraph "Infrastructure"
MySQL["MySQL 8.0"]
Soketi["Soketi (Pusher-compatible)"]
Neo["Neo Object Storage (S3-compatible)"]
end
Web --> Auth
Web --> DB
Web --> S3
Web --> Pusher
DB --> MySQL
Pusher --> Soketi
S3 --> Neo
```

**Diagram sources**
- [src/lib/auth.ts:20-92](file://src/lib/auth.ts#L20-L92)
- [src/lib/prisma.ts:9-20](file://src/lib/prisma.ts#L9-L20)
- [src/lib/storage.ts:32-40](file://src/lib/storage.ts#L32-L40)
- [src/lib/pusher.ts:3-10](file://src/lib/pusher.ts#L3-L10)
- [docker-compose.yaml:5-43](file://docker-compose.yaml#L5-L43)

## Conclusion
You now have the complete setup workflow for the POS and Production Management System. By following the steps above—installing prerequisites, configuring environment variables, migrating and seeding the database, and starting the development server—you can run the system locally. For production-like environments, use the provided Docker configuration to spin up MySQL, phpMyAdmin, and Soketi alongside the application.