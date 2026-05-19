"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeCurrency, supportedCurrencies, type CurrencyCode } from "@/lib/finance";

export function CurrencySettings({ initialCurrency }: { initialCurrency: string }) {
  const router = useRouter();
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(normalizeCurrency(initialCurrency));
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currencyCode }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Unable to save currency");
      }
      toast.success("Currency preference saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save currency");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Currency</CardTitle>
        <CardDescription>Switch between Trinidad and Tobago dollars and US dollars for display.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="display-currency">Display currency</Label>
          <Select value={currencyCode} onValueChange={(value) => setCurrencyCode(normalizeCurrency(value))}>
            <SelectTrigger id="display-currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {supportedCurrencies.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.code} - {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Saving..." : "Save currency"}
        </Button>
      </CardContent>
    </Card>
  );
}
