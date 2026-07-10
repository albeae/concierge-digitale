"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, Printer, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Genera il data URL PNG del QR che punta alla guida della struttura.
 * L'URL usa SEMPRE il dominio canonico di produzione (`SITE_URL`), MAI
 * `window.location.origin`: un QR generato da una preview Vercel o da
 * localhost codificherebbe un indirizzo temporaneo, e questo QR finisce
 * stampato su carta in camera (errore evitato 2026-07-10, review Codex).
 * Colori: default della libreria (nero su bianco), MAI il tema — un QR a
 * basso contrasto può non scansionarsi.
 */
export function useQrDataUrl(path: string, width: number) {
  const [result, setResult] = useState<{ url: string; dataUrl: string } | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    const url = `${SITE_URL}${path}`;
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
 * Manda la guida all'ospite prima dell'arrivo: prova la condivisione nativa
 * (`navigator.share`, su mobile apre il foglio di sistema con WhatsApp, SMS,
 * ecc.) e, dove non c'è, ripiega su WhatsApp Web con testo precompilato. In
 * nessun caso si chiede o si salva il numero dell'ospite: il destinatario lo
 * sceglie il titolare nell'app di messaggistica.
 */
function ShareGuide({ bnbId, bnbName }: { bnbId: string; bnbName: string }) {
  const [copied, setCopied] = useState(false);

  const guideUrl = `${SITE_URL}/${bnbId}`;
  const shareText = `Ecco la guida di ${bnbName}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${shareText}: ${guideUrl}`,
  )}`;

  const openWhatsapp = () =>
    window.open(whatsappHref, "_blank", "noopener,noreferrer");

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: bnbName, text: shareText, url: guideUrl });
      } catch (err) {
        // AbortError = il titolare ha chiuso il foglio di condivisione: ok,
        // nessun fallback. Per un errore vero ripieghiamo su WhatsApp.
        if ((err as Error)?.name !== "AbortError") openWhatsapp();
      }
    } else {
      openWhatsapp();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(guideUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard non disponibile: il link resta comunque leggibile a schermo */
    }
  };

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <p className="text-sm font-semibold">Condividi il link con l&apos;ospite</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Mandaglielo prima dell&apos;arrivo: apre la guida senza installare
        nulla. Il numero dell&apos;ospite non viene salvato da nessuna parte.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          onClick={handleShare}
          className="h-11 gap-2 rounded-2xl bg-terracotta px-4 font-semibold text-primary-foreground hover:bg-terracotta-strong"
        >
          <Share2 className="size-4" aria-hidden />
          Condividi la guida
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          className="h-11 gap-2 rounded-2xl px-4 font-semibold"
        >
          {copied ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
          {copied ? "Copiato!" : "Copia link"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Sezione QR dell'editor: anteprima del codice, download PNG, link alla scheda
 * A6 stampabile da mettere in camera e condivisione del link all'ospite. Il QR
 * e il link codificano solo https://dominio/<slug>: tutta la logica resta nel
 * routing (vedi CLAUDE.md).
 */
export function QrSection({ bnbId, bnbName }: { bnbId: string; bnbName: string }) {
  const { dataUrl } = useQrDataUrl(`/${bnbId}`, 480);
  const guideUrl = `${SITE_URL}/${bnbId}`;

  return (
    <Card className="py-0">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-4">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR code della guida di ${bnbName}`}
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
              {guideUrl}
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

        <ShareGuide bnbId={bnbId} bnbName={bnbName} />
      </CardContent>
    </Card>
  );
}
