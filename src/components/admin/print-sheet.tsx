"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, Printer, Wifi } from "lucide-react";
import { useQrDataUrl } from "@/components/admin/qr-section";
import { Button } from "@/components/ui/button";

interface PrintSheetProps {
  bnbId: string;
  bnbName: string;
  wifiNetwork: string;
  wifiPassword: string;
}

/**
 * Scheda "Wi-Fi & Guida" in formato A6 (105×148 mm) da stampare e mettere in
 * camera: nome struttura, credenziali Wi-Fi e QR della guida. A schermo la
 * scheda si adatta (max-w-full, niente scroll orizzontale sul telefono); in
 * stampa ha le dimensioni reali e i controlli spariscono.
 */
export function PrintSheet({
  bnbId,
  bnbName,
  wifiNetwork,
  wifiPassword,
}: PrintSheetProps) {
  const { dataUrl } = useQrDataUrl(`/${bnbId}`, 600);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center gap-6 bg-background px-5 py-8 print:block print:min-h-0 print:max-w-none print:bg-transparent print:p-0">
      {/* Dimensioni carta per la stampa: A6, senza margini del browser. */}
      <style>{`@page { size: A6; margin: 0; }`}</style>

      <div className="no-print flex w-full items-center justify-between gap-3 print:hidden">
        <Link
          href={`/admin/${bnbId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Torna all&apos;editor
        </Link>
        <Button
          type="button"
          onClick={() => window.print()}
          className="h-11 gap-2 rounded-2xl bg-terracotta px-5 font-semibold text-primary-foreground hover:bg-terracotta-strong"
        >
          <Printer className="size-4" aria-hidden />
          Stampa
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground print:hidden">
        Scegli il formato carta A6 nella finestra di stampa, oppure stampa su
        A4 e ritaglia lungo il bordo.
      </p>

      {/* La scheda vera e propria: 105×148 mm in stampa. */}
      <div className="flex w-[105mm] max-w-full flex-col items-center gap-4 rounded-3xl border border-border bg-card p-6 text-center text-card-foreground shadow-soft print:h-[148mm] print:w-[105mm] print:max-w-none print:gap-3 print:rounded-none print:border-0 print:shadow-none">
        <p className="text-xl font-bold tracking-tight">{bnbName}</p>

        <div className="w-full space-y-1.5 rounded-2xl bg-secondary p-3.5 print:p-3">
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Wifi className="size-3.5" aria-hidden />
            Wi-Fi
          </p>
          {wifiNetwork && (
            <p className="min-h-5 text-sm">
              Rete / Network:{" "}
              <span className="font-mono font-bold">{wifiNetwork}</span>
            </p>
          )}
          {wifiPassword && (
            <p className="min-h-5 text-sm">
              Password:{" "}
              <span className="font-mono font-bold">{wifiPassword}</span>
            </p>
          )}
        </div>

        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR code della guida di ${bnbName}`}
            className="aspect-square w-40 print:w-44"
          />
        ) : (
          <div
            aria-hidden
            className="aspect-square w-40 animate-pulse rounded-xl bg-secondary print:w-44"
          />
        )}

        <div className="space-y-0.5 text-xs leading-relaxed text-muted-foreground">
          <p>Inquadra il QR per la guida completa della casa</p>
          <p>Scan the QR for the full house guide</p>
          <p>Escanea el QR para la guía completa de la casa</p>
        </div>
      </div>
    </div>
  );
}
