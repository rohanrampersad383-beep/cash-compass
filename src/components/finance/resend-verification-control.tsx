"use client";

import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ResendVerificationControl() {
  const [pending, setPending] = useState(false);

  async function resend() {
    setPending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Verification email could not be sent.");
      }

      toast.success(json.message ?? "Verification link sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification email could not be sent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={resend} disabled={pending}>
      <MailCheck data-icon="inline-start" />
      {pending ? "Sending..." : "Resend verification"}
    </Button>
  );
}
