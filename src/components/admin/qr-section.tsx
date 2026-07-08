"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import QRCode from "qrcode";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Genera il data URL PNG del QR che punta alla guida della struttura.
 * L'URL usa l'origin corrente: in produzione è il dominio vero del sito
 * (l'admin gira sullo stesso deploy della pagina ospite), in locale localhost.
 * Colori: default della libreria (nero su bianco), MAI il tema — un QR a
 * basso contrasto può non scansionarsi.
 */
export function useQrDataUrl(path: string, width: number) {
  const [result, setResult] = useState<{ url: string; dataUrl: string } | null>(
    null,
  );

  // window.location esiste solo nel browser: si genera tutto dopo il mount
  // (il primo render server/client mostra il placeholder).
  useEffect(() => {
    let active = true;
    const url = `${window.location.origin}${path}`;
    QRCode.toDataURL(url, { width, margin: 1, errorCorrectionLevel: "M" })
      .then((dataUrl) => {
        if (active) setResult({ url, dataUrl });
      })
      .catch((err) => console.error("[admin] generazione QR fallita:", err));
    return () => {
      active = false;
    };
  }, [path, width]);

  return { url: result?.url ?? null, dataUrl: result?.dataUrl ?? null };
}

/**
 * Sezione QR dell'editor: anteprima del codice, download PNG e link alla
 * scheda A6 stampabile da mettere in camera. Il QR codifica solo
 * https://dominio/<slug>: tutta la logica resta nel routing (vedi CLAUDE.md).
 */
export function QrSection({ bnbId }: { bnbId: string }) {
  const { url, dataUrl } = useQrDataUrl(`/${bnbId}`, 480);

  return (
    <Card className="py-0">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-4">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR code della guida di ${bnbId}`}
              className="size-32 shrink-0 rounded-xl border border-border"
            />
          ) : (
            <div
              aria-hidden
              className="size-32 shrink-0 animate-pulse rounded-xl border border-border bg-secondary"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Il QR della tua guida
            </p>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {url ?? "…"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Gli ospiti lo inquadrano con la fotocamera e aprono la guida:
              niente app da installare.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={dataUrl ?? undefined}
            download={`qr-${bnbId}.png`}
            aria-disabled={!dataUrl}
            className={cn(
              buttonVariants(),
              "h-11 gap-2 rounded-2xl bg-terracotta px-4 font-semibold text-primary-foreground hover:bg-terracotta-strong",
              !dataUrl && "pointer-events-none opacity-50",
            )}
          >
            <Download className="size-4" aria-hidden />
            Scarica PNG
          </a>
          <Link
            href={`/admin/${bnbId}/stampa`}
            target="_blank"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 gap-2 rounded-2xl px-4 font-semibold",
            )}
          >
            <Printer className="size-4" aria-hidden />
            Stampa scheda A6
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
