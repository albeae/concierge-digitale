"use client";

import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/admin/field";
import { cn } from "@/lib/utils";

const HEX = /^#[0-9a-fA-F]{6}$/;

interface ColorPickerFieldProps {
  /** Nome del campo inviato nel form (il valore viaggia nell'input testo). */
  name: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Campo colore con selettore moderno: uno swatch che apre un popover con la
 * ruota saturazione/tonalità (react-colorful), più il codice hex modificabile
 * a mano. Chiude cliccando fuori o con Esc.
 */
export function ColorPickerField({
  name,
  label,
  hint,
  value,
  onChange,
}: ColorPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const valid = HEX.test(value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* flex-wrap su mobile: swatch + testo sulla prima riga, hex input a
          tutta larghezza sotto (così nome e descrizione NON vengono tagliati
          dallo spazio stretto del telefono). Da sm in su torna tutto in linea. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-xl border border-border bg-card p-2.5 sm:flex-nowrap">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={`${label}: apri il selettore colore`}
          aria-expanded={open}
          className="size-10 shrink-0 rounded-lg border border-border/70 shadow-soft transition-transform active:scale-95"
          style={{ backgroundColor: valid ? value : "#ffffff" }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{label}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <Input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label}: codice colore`}
          spellCheck={false}
          className={cn(
            // w-full su mobile (l'input va sulla sua riga, sotto al testo);
            // w-28 in linea da sm in su. text-base su mobile: sotto i 16px iOS
            // zooma la pagina al tocco e i campi "escono" dallo schermo.
            "w-full shrink-0 font-mono text-base uppercase sm:w-28 sm:text-xs",
            !valid && "border-destructive/60",
          )}
        />
      </div>

      {open && (
        // left-0 right-0 + max-w: il popover non supera mai la larghezza del
        // campo, quindi resta dentro lo schermo anche sui telefoni stretti
        // (react-colorful si adatta via .picker in globals.css).
        <div className="picker absolute left-0 right-0 top-full z-30 mt-2 max-w-72 rounded-2xl border border-border bg-card p-3 shadow-raised">
          <HexColorPicker
            color={valid ? value : "#ffffff"}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
}
