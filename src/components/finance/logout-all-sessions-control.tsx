"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LogoutAllSessionsControl() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function logoutAll() {
    setPending(true);

    try {
      const response = await fetch("/api/auth/logout-all", { method: "POST" });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Sessions could not be cleared.");
      }

      toast.success("All sessions signed out");
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sessions could not be cleared.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <LogOut data-icon="inline-start" />
        Logout all sessions
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Logout all sessions</DialogTitle>
          <DialogDescription>
            This signs out this account on every browser and device by deleting all active session records.
            You will be sent back to the home page.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={logoutAll} disabled={pending}>
            {pending ? "Signing out..." : "Logout everywhere"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
