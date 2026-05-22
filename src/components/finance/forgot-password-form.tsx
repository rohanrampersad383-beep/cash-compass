"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email") }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Password reset request failed.");
      }

      setSubmitted(true);
      toast.success(json.message ?? "If an account exists for that email, a reset link has been sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password reset request failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="glass-panel w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your email and Cash Compass will send a reset link if the account exists.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        {submitted ? (
          <p className="mt-4 text-sm text-muted-foreground">
            If an account exists for that email, a reset link has been sent.
          </p>
        ) : null}
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link className="font-medium text-primary" href="/login">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
