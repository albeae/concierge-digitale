"use client";

import { Copy, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import type { UiStrings } from "@/lib/i18n";

interface WifiCardProps {
  networkName: string;
  password: string;
  t: UiStrings["wifi"];
}

export function WifiCard({ networkName, password, t }: WifiCardProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success(t.copied);
    } catch {
      /* clipboard non disponibile: l'utente può comunque leggere la password */
    }
  };

  return (
    <Card className="border-none bg-terracotta py-0 text-primary-foreground shadow-brand">
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <Wifi className="size-5" aria-hidden />
          <span className="text-lg font-semibold">{t.title}</span>
        </div>

        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-primary-foreground/70">
          {t.network}
        </p>
        <p className="font-mono text-lg font-semibold">{networkName}</p>

        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-primary-foreground/70">
          {t.password}
        </p>
        <p className="font-mono text-3xl font-bold tracking-tight">{password}</p>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary-foreground text-base font-semibold text-terracotta transition-transform active:scale-[0.98]"
        >
          <Copy className="size-5" aria-hidden />
          {t.copy}
        </button>
      </CardContent>
    </Card>
  );
}
