"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster richColors closeButton />
    </ThemeProvider>
  );
}
