import Link from "next/link";
import { CashCompassLogo } from "@/components/brand/cash-compass-logo";
import { ForgotPasswordForm } from "@/components/finance/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 grid-glow opacity-50" />
      <div className="relative flex w-full max-w-5xl flex-col items-center gap-8">
        <Link href="/" className="text-sm font-medium text-muted-foreground">
          <CashCompassLogo />
        </Link>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
