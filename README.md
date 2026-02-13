# 🚀 Next.js Starter with RBAC & Authentication

A production-ready Next.js starter template with built-in **Role-Based Access Control (RBAC)**, authentication using **Better Auth**, and **Prisma ORM** for database management.

## ✨ Features

- ⚡ **Next.js 16** with App Router
- 🔐 **Better Auth** — Email/Password + Google OAuth
- 🛡️ **RBAC System** — 5 roles, granular permissions, dynamic navigation
- 🗄️ **Prisma ORM** — Type-safe database with MySQL
- 🎨 **Tailwind CSS 4** + HeroUI + Radix UI
- 📱 **Responsive Design** — Mobile-first with collapsible sidebar
- ✅ **Form Validation** — React Hook Form + Zod
- 🔒 **Protected Routes** — Server-side authentication
- 📊 **Admin Dashboard** — User management, role assignment, bulk actions
- 🎭 **Dynamic Sidebar** — Menu otomatis mengikuti role user

## 🎯 Tech Stack

| Category      | Technology              |
| ------------- | ----------------------- |
| **Framework** | Next.js 16 (App Router) |
| **Language**  | TypeScript              |
| **Database**  | MySQL 8.0+              |
| **ORM**       | Prisma ORM              |
| **Auth**      | Better Auth             |
| **Styling**   | Tailwind CSS 4          |
| **UI**        | HeroUI, Radix UI        |
| **Animation** | Framer Motion           |
| **Forms**     | React Hook Form + Zod   |
| **State**     | SWR, Zustand            |
| **Icons**     | Lucide React            |

## 📦 Quick Start

### Prerequisites

- Node.js 18.x or higher
- MySQL 8.0 or higher
- npm / yarn / pnpm / bun

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Nextjs-starter

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# 4. Generate auth secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Copy the output to BETTER_AUTH_SECRET in .env

# 5. Setup database
npx prisma migrate dev
npx prisma db seed

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app! 🎉

## 🎭 RBAC Roles

5 built-in roles with granular permissions:

| Role       | Label            | Access                            |
| ---------- | ---------------- | --------------------------------- |
| `admin`    | Administrator    | Full access + user management     |
| `kasir`    | Admin CS / Kasir | POS, pelanggan, pembayaran        |
| `designer` | Designer         | Antrian desain, upload file       |
| `produksi` | Produksi         | Tracking & update status produksi |
| `gudang`   | Gudang           | Inventori bahan baku              |

### Permission Matrix

| Module      | Admin | Kasir | Designer | Produksi | Gudang |
| ----------- | :---: | :---: | :------: | :------: | :----: |
| POS         |  ✅   |  ✅   |    ❌    |    ❌    |   ❌   |
| Pelanggan   |  ✅   |  ✅   |    ❌    |    ❌    |   ❌   |
| Pembayaran  |  ✅   |  ✅   |    ❌    |    ❌    |   ❌   |
| Desain      |  ✅   |  ❌   |    ✅    |    ❌    |   ❌   |
| Produksi    |  ✅   |  👁️   |    ❌    |    ✅    |   ❌   |
| Inventori   |  ✅   |  ❌   |    ❌    |    ❌    |   ✅   |
| Laporan     |  ✅   |  ❌   |    ❌    |    ❌    |   ❌   |
| Master Data |  ✅   |  ⚡   |    ❌    |    ❌    |   ⚡   |
| User Mgmt   |  ✅   |  ❌   |    ❌    |    ❌    |   ❌   |

> 👁️ = view only &nbsp; ⚡ = partial access

### Dynamic Navigation

The sidebar automatically adapts to the user's role — only showing menus they have access to. Configuration is centralized in `src/config/navigation.ts`.

## 📁 Project Structure

```
src/
├── app/
│   ├── (LoggedIn)/       # Protected routes (sidebar layout)
│   │   ├── dashboard/    # Main dashboard
│   │   ├── master/user/  # User management (CRUD + bulk)
│   │   ├── rbac/         # Roles & Permissions pages
│   │   └── settings/     # Profile & Security
│   ├── auth/             # Login & Register pages
│   └── api/              # API routes
├── components/
│   ├── ui/               # UI primitives (shadcn-style)
│   ├── app-sidebar.tsx   # Role-filtered sidebar
│   └── nav-main.tsx      # Navigation renderer
├── config/
│   ├── navigation.ts     # Nav items with role mapping
│   └── roles.ts          # Centralized role definitions
└── lib/
    ├── auth.ts           # Better Auth server config
    ├── auth-client.ts    # Client-side auth utilities
    ├── permissions.ts    # Access control & role definitions
    └── prisma.ts         # Prisma client singleton
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint

# Database (Prisma)
npx prisma migrate dev       # Create and apply migrations
npx prisma migrate deploy    # Apply migrations (production)
npx prisma generate          # Generate Prisma Client
npx prisma db seed           # Run database seeding
npx prisma studio            # Open Prisma Studio GUI
npx prisma migrate reset     # Reset database
```

## 🔐 Authentication

This starter uses [Better Auth](https://better-auth.com):

- ✅ Email & Password authentication
- ✅ Google OAuth integration
- ✅ Session-based auth with cookies
- ✅ Server-side session validation
- ✅ Protected routes
- ✅ Profile & Security settings
- ✅ Custom password hashing (Argon2)

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="mysql://user:pass@localhost:3306/dbname"
BETTER_AUTH_SECRET="generate-with-the-command-above"
BETTER_AUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

## 🚀 Deployment

```bash
# Ensure DATABASE_URL is set
npm run build
npm start
```

Required env vars for production:

- `DATABASE_URL` — MySQL connection string
- `BETTER_AUTH_SECRET` — Auth secret key
- `BETTER_AUTH_URL` — Production URL
- `NODE_ENV=production`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Better Auth](https://better-auth.com/)
- [Prisma ORM](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [HeroUI](https://heroui.com/)
- [Radix UI](https://www.radix-ui.com/)

---

**Made with ❤️ for developers who want to start fast**
