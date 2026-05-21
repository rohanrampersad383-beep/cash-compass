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

export function AuthForm({ mode, demo = false }: { mode: "login" | "register"; demo?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    if (mode === "register" && !isStrongPassword(password)) {
      toast.error(PASSWORD_ERROR);
      setPending(false);
      return;
    }

    const payload =
      mode === "register"
        ? {
            name: form.get("name"),
            email: form.get("email"),
            password,
          }
        : {
            email: form.get("email"),
            password,
          };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Authentication failed");
      }
      toast.success(mode === "register" ? "Registration submitted. Log in to continue." : "Welcome back");
      router.push(mode === "register" ? json.redirectTo ?? "/login" : "/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="glass-panel w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "register" ? "Create your account" : demo ? "Try the demo workspace" : "Welcome back"}</CardTitle>
        <CardDescription>
          {mode === "register"
            ? "Start with a private workspace for your financial habits."
            : demo
              ? "Demo credentials are filled in so you can inspect the seeded dashboard quickly."
              : "Log in to your private Cash Compass workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {mode === "register" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Rohan" />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="demo@financialtracks.dev"
              defaultValue={demo ? "demo@financialtracks.dev" : ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "register" ? 10 : undefined}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder={demo ? "password123" : "Enter your password"}
              defaultValue={demo ? "password123" : ""}
              aria-describedby={mode === "register" ? "password-requirements" : undefined}
            />
            {mode === "register" ? (
              <ul id="password-requirements" className="grid gap-1 text-xs text-muted-foreground">
                {PASSWORD_REQUIREMENTS.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Please wait..." : mode === "register" ? "Create account" : demo ? "Open demo dashboard" : "Log in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "register" ? "Already have an account?" : "New to Cash Compass?"}{" "}
          <Link className="font-medium text-primary" href={mode === "register" ? "/login" : "/register"}>
            {mode === "register" ? "Log in" : "Create one"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
