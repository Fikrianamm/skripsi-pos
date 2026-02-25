import { redirect } from "next/navigation";

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const { error } = await searchParams;

  const errorMessage = error
    ? decodeURIComponent(error.replace(/_/g, " "))
    : "Terjadi kesalahan autentikasi.";

  redirect(`/auth/login?authError=${encodeURIComponent(errorMessage)}`);
}
