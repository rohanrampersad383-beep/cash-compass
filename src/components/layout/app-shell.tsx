"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AreaChart,
  Bot,
  CircleDollarSign,
  Goal,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ReceiptText,
  Settings,
  Upload,
  WalletCards,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { CashCompassLogo } from "@/components/brand/cash-compass-logo";
import { PageTransition } from "@/components/finance/page-transition";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { SafeUser } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: WalletCards },
  { href: "/bills", label: "Bills", icon: ReceiptText },
  { href: "/budgets", label: "Budgets", icon: CircleDollarSign },
  { href: "/savings-goals", label: "Savings Goals", icon: Goal },
  { href: "/statement-upload", label: "Statement Upload", icon: Upload },
  { href: "/analytics", label: "Analytics", icon: AreaChart },
  { href: "/assistant", label: "Compass Guide", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  const sidebar = (
    <aside className="flex h-full flex-col gap-5 p-4">
      <Link href="/dashboard" className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 shadow-lg shadow-primary/5 transition hover:border-primary/25 hover:bg-primary/[0.04]">
        <CashCompassLogo />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "text-sidebar-accent-foreground",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-accent shadow-sm shadow-primary/10 ring-1 ring-primary/15"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              {active ? <span className="absolute left-0 z-10 h-6 w-1 rounded-r-full bg-primary" /> : null}
              <Icon className="relative z-10 size-4" aria-hidden="true" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-xl border bg-background/70 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Moon data-icon="inline-start" />
            Theme
          </Button>
          <Button variant="outline" size="sm" onClick={logout} aria-label="Sign out">
            <LogOut data-icon="inline-start" />
          </Button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 grid-glow opacity-40" />
      <div className="pointer-events-none fixed inset-0 ambient-spotlight" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 app-beams" aria-hidden="true" />
      <div className="pointer-events-none fixed right-4 top-20 size-32 compass-pulse opacity-60 sm:right-8 sm:size-44 lg:size-56" aria-hidden="true" />
      <div className="relative flex min-h-screen">
        <div className="fixed inset-y-0 left-0 hidden w-72 border-r bg-sidebar/95 lg:block">
          {sidebar}
        </div>
        <main className="min-w-0 flex-1 lg:ml-72 lg:w-[calc(100%-18rem)] lg:flex-none">
          <header className="mobile-header-glow sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 supports-backdrop-filter:bg-background/75 supports-backdrop-filter:backdrop-blur-sm lg:hidden">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold" aria-label="Cash Compass dashboard">
              <CashCompassLogo showTagline={false} />
            </Link>
            <Sheet>
              <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open navigation" />}>
                <Menu />
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
          </header>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <PageTransition>{children}</PageTransition>
          </div>
          <Link
            href="/transactions"
            className="premium-glow fixed bottom-5 right-5 z-30 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-1 active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
            aria-label="Add transaction"
          >
            <WalletCards className="size-5" aria-hidden="true" />
          </Link>
        </main>
      </div>
    </div>
  );
}
