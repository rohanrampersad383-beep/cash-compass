"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function fileNameFromResponse(response: Response) {
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? `cash-compass-export-${new Date().toISOString().slice(0, 10)}.json`;
}

export function ExportDataControl() {
  const [pending, setPending] = useState(false);

  async function downloadData() {
    setPending(true);

    try {
      const response = await fetch("/api/account/export", { method: "GET" });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error ?? "Data export failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFromResponse(response);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Data export failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" onClick={downloadData} disabled={pending}>
      <Download data-icon="inline-start" />
      {pending ? "Preparing export..." : "Download my data"}
    </Button>
  );
}
