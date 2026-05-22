import Link from "next/link";
import { CashCompassLogo } from "@/components/brand/cash-compass-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyEmailWithToken } from "@/lib/auth-recovery";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const verified = params.token ? await verifyEmailWithToken(params.token) : false;

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 grid-glow opacity-50" />
      <div className="relative flex w-full max-w-5xl flex-col items-center gap-8">
        <Link href="/" className="text-sm font-medium text-muted-foreground">
          <CashCompassLogo />
        </Link>
        <Card className="glass-panel w-full max-w-md">
          <CardHeader>
            <CardTitle>{verified ? "Your email has been verified." : "We could not verify this link."}</CardTitle>
            <CardDescription>
              {verified
                ? "Your Cash Compass account recovery email is ready."
                : "This verification link may be expired or already used."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="font-medium text-primary" href={verified ? "/dashboard" : "/settings"}>
              {verified ? "Go to dashboard" : "Go to settings"}
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
