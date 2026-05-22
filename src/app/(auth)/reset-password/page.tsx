import Link from "next/link";
import { CashCompassLogo } from "@/components/brand/cash-compass-logo";
import { ResetPasswordForm } from "@/components/finance/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 grid-glow opacity-50" />
      <div className="relative flex w-full max-w-5xl flex-col items-center gap-8">
        <Link href="/" className="text-sm font-medium text-muted-foreground">
          <CashCompassLogo />
        </Link>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <Card className="glass-panel w-full max-w-md">
            <CardHeader>
              <CardTitle>Reset link missing</CardTitle>
              <CardDescription>Request a new password reset link to continue.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link className="font-medium text-primary" href="/forgot-password">
                Request another reset
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
