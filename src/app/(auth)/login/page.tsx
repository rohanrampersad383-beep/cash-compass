import Link from "next/link";
import { AuthForm } from "@/components/finance/auth-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 grid-glow opacity-50" />
      <div className="relative flex w-full max-w-5xl flex-col items-center gap-8">
        <Link href="/" className="text-sm font-medium text-muted-foreground">Financial Tracks</Link>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
