"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode, demo = false }: { mode: "login" | "register"; demo?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
          }
        : {
            email: form.get("email"),
            password: form.get("password"),
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
      toast.success(mode === "register" ? "Account created" : "Welcome back");
      router.push("/dashboard");
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
              : "Log in to your private Financial Tracks workspace."}
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
              placeholder="password123"
              defaultValue={demo ? "password123" : ""}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Please wait..." : mode === "register" ? "Create account" : demo ? "Open demo dashboard" : "Log in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "register" ? "Already have an account?" : "New to Financial Tracks?"}{" "}
          <Link className="font-medium text-primary" href={mode === "register" ? "/login" : "/register"}>
            {mode === "register" ? "Log in" : "Create one"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
