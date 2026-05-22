"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isStrongPassword, PASSWORD_ERROR, PASSWORD_REQUIREMENTS } from "@/lib/password-security";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    if (!isStrongPassword(password)) {
      toast.error(PASSWORD_ERROR);
      setPending(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Password could not be reset.");
      }

      toast.success(json.message ?? "Your password has been updated.");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password could not be reset.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="glass-panel w-full max-w-md">
      <CardHeader>
        <CardTitle>Create a new password</CardTitle>
        <CardDescription>Use a strong password. Active sessions will be signed out after reset.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              aria-describedby="password-requirements"
            />
            <ul id="password-requirements" className="grid gap-1 text-xs text-muted-foreground">
              {PASSWORD_REQUIREMENTS.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </div>
          <Button type="submit" disabled={pending || !token}>
            {pending ? "Updating..." : "Update password"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Need a new link?{" "}
          <Link className="font-medium text-primary" href="/forgot-password">
            Request another reset
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
