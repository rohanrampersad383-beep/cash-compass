"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AreaChart,
  Banknote,
  Bot,
  CreditCard,
  Goal,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PieChart,
  ReceiptText,
  Settings,
  Upload,
  WalletCards,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { SafeUser } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: WalletCards },
  { href: "/income", label: "Income", icon: Banknote },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/bills", label: "Bills", icon: ReceiptText },
  { href: "/savings-goals", label: "Savings Goals", icon: Goal },
  { href: "/statement-upload", label: "Statement Upload", icon: Upload },
  { href: "/analytics", label: "Analytics", icon: AreaChart },
  { href: "/assistant", label: "Finance Assistant", icon: Bot },
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
      <Link href="/dashboard" className="flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <PieChart data-icon="inline-start" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Financial Tracks</p>
          <p className="text-xs text-muted-foreground">Clarity dashboard</p>
        </div>
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
                active && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
              )}
            >
              {active ? <span className="absolute left-0 h-6 w-1 rounded-r-full bg-primary" /> : null}
              <Icon data-icon="inline-start" />
              <span>{item.label}</span>
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
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 grid-glow opacity-40" />
      <div className="relative flex min-h-screen">
        <div className="fixed inset-y-0 left-0 hidden w-72 border-r bg-sidebar/90 backdrop-blur-xl lg:block">
          {sidebar}
        </div>
        <main className="min-w-0 flex-1 lg:pl-72">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/75 px-4 backdrop-blur-xl lg:hidden">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Home data-icon="inline-start" />
              Financial Tracks
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
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
