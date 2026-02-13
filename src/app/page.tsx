import {
  ShieldCheck,
  Lock,
  Database,
  Paintbrush,
  Smartphone,
  FileCheck,
  Users,
  LayoutDashboard,
  ArrowRight,
  Github,
} from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: Lock,
    title: "Better Auth",
    description:
      "Autentikasi email & password, session-based, dengan Google OAuth siap pakai.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    icon: ShieldCheck,
    title: "RBAC System",
    description:
      "5 role bawaan dengan permission granular per modul. Sidebar otomatis mengikuti role.",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/40",
  },
  {
    icon: Database,
    title: "Prisma + MySQL",
    description: "Type-safe ORM dengan migrasi, seeding, dan Prisma Studio.",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    icon: Paintbrush,
    title: "Tailwind CSS 4",
    description: "Styling modern dengan HeroUI, Radix UI, dan Framer Motion.",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/40",
  },
  {
    icon: Smartphone,
    title: "Responsive Design",
    description:
      "Mobile-first layout dengan collapsible sidebar dan breakpoint yang optimal.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    icon: FileCheck,
    title: "Form Validation",
    description:
      "React Hook Form + Zod untuk validasi form yang type-safe dan deklaratif.",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
  },
  {
    icon: Users,
    title: "User Management",
    description:
      "CRUD pengguna, assign role, bulk delete, filter & search bawaan.",
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/40",
  },
  {
    icon: LayoutDashboard,
    title: "Admin Dashboard",
    description:
      "Halaman admin siap pakai dengan sidebar navigasi dinamis per role.",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/40",
  },
];

const TECH_STACK = [
  { name: "Next.js 16", url: "https://nextjs.org" },
  { name: "TypeScript", url: "https://www.typescriptlang.org" },
  { name: "Better Auth", url: "https://better-auth.com" },
  { name: "Prisma", url: "https://www.prisma.io" },
  { name: "Tailwind CSS 4", url: "https://tailwindcss.com" },
  { name: "HeroUI", url: "https://heroui.com" },
  { name: "Radix UI", url: "https://www.radix-ui.com" },
  { name: "Framer Motion", url: "https://www.framer.com/motion" },
];

export default function Page() {
  return (
    <div className="min-h-dvh flex flex-col bg-linear-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white/70 dark:bg-slate-950/70 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            🚀 Next.js Starter
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/fikrianamm/nextjs-starter"
              className="text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
            >
              <Github size={20} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 sm:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium bg-white dark:bg-slate-800 text-muted-foreground">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            Open Source · Next.js 16 · Better Auth · Prisma
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Next.js Starter
            <br />
            <span className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              with RBAC & Auth
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Template production-ready dengan autentikasi, role-based access
            control, user management, dan admin dashboard — siap pakai dalam
            hitungan menit.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link
              href="https://github.com/fikrianamm/nextjs-starter"
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Github size={16} />
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 sm:py-24 border-t bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Semua yang Kamu Butuhkan
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Fitur-fitur essential untuk memulai project Next.js modern dengan
              cepat dan aman.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={`rounded-xl border p-5 ${feature.bg} hover:shadow-md transition-shadow`}
              >
                <div
                  className={`inline-flex p-2 rounded-lg ${feature.color} bg-white dark:bg-slate-800 mb-3`}
                >
                  <feature.icon size={20} />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RBAC Preview */}
      <section className="px-4 py-16 sm:py-24 border-t">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">
              RBAC Sudah Terkonfigurasi
            </h2>
            <p className="text-muted-foreground mt-2">
              5 role bawaan dengan hak akses granular, langsung pakai
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                role: "Admin",
                desc: "Full access",
                color:
                  "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
              },
              {
                role: "Kasir",
                desc: "POS & pelanggan",
                color:
                  "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
              },
              {
                role: "Designer",
                desc: "Antrian desain",
                color:
                  "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
              },
              {
                role: "Produksi",
                desc: "Tracking SPK",
                color:
                  "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
              },
              {
                role: "Gudang",
                desc: "Inventori bahan",
                color:
                  "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
              },
            ].map((item) => (
              <div
                key={item.role}
                className={`rounded-xl border p-4 text-center ${item.color}`}
              >
                <p className="font-semibold text-sm">{item.role}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="px-4 py-16 sm:py-24 border-t bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Tech Stack</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {TECH_STACK.map((tech) => (
              <Link
                key={tech.name}
                href={tech.url}
                target="_blank"
                className="inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {tech.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="px-4 py-16 sm:py-24 border-t">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            Quick Start
          </h2>
          <div className="rounded-xl border bg-slate-950 dark:bg-slate-900 text-slate-100 p-6 overflow-x-auto">
            <pre className="text-sm leading-relaxed">
              <code>{`# Clone & install
git clone <your-repo-url>
cd Nextjs-starter && npm install

# Setup environment
cp .env.example .env

# Database
npx prisma migrate dev
npx prisma db seed

# Run! 🚀
npm run dev`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Made with ❤️ for developers who want to start fast.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="hover:text-foreground transition-colors"
            >
              Register
            </Link>
            <Link
              href="https://github.com/fikrianamm/nextjs-starter"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
