"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateBnbGeneral } from "@/app/admin/[bnbId]/actions";
import { FieldRow, Input } from "@/components/admin/field";
import { StatusMessage } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Bnb } from "@/types";

const TOGGLES: { name: keyof Bnb["toggles"]; label: string }[] = [
  { name: "hasKitchen", label: "Cucina a disposizione" },
  { name: "hasParking", label: "Parcheggio" },
  { name: "offersBreakfast", label: "Colazione inclusa" },
];

const COLORS: { name: keyof Bnb["theme"]; label: string }[] = [
  { name: "primaryColor", label: "Colore primario" },
  { name: "secondaryColor", label: "Colore secondario" },
  { name: "backgroundColor", label: "Sfondo" },
];

export function GeneralForm({ bnb }: { bnb: Bnb }) {
  const action = updateBnbGeneral.bind(null, bnb.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <Card>
      <CardContent className="p-5">
        <form action={formAction} className="space-y-5">
          <FieldRow label="Nome struttura" htmlFor="name">
            <Input id="name" name="name" defaultValue={bnb.name} required />
          </FieldRow>

          <fieldset className="space-y-3">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Colori del tema
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {COLORS.map((c) => (
                <div key={c.name}>
                  <label
                    htmlFor={c.name}
                    className="mb-1.5 block text-xs text-muted-foreground"
                  >
                    {c.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-9 shrink-0 rounded-lg border border-border"
                      style={{ backgroundColor: bnb.theme[c.name] }}
                    />
                    <Input
                      id={c.name}
                      name={c.name}
                      defaultValue={bnb.theme[c.name]}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldRow label="Logo (URL)" htmlFor="logoUrl">
              <Input
                id="logoUrl"
                name="logoUrl"
                defaultValue={bnb.theme.logoUrl}
              />
            </FieldRow>
            <FieldRow label="Immagine hero (URL)" htmlFor="heroImage">
              <Input
                id="heroImage"
                name="heroImage"
                defaultValue={bnb.theme.heroImage}
              />
            </FieldRow>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Servizi
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {TOGGLES.map((tgl) => (
                <label
                  key={tgl.name}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    name={tgl.name}
                    defaultChecked={bnb.toggles[tgl.name]}
                    className="size-4 accent-terracotta"
                  />
                  {tgl.label}
                </label>
              ))}
            </div>
          </fieldset>

          <FieldRow
            label="Indirizzo (mappa)"
            htmlFor="address"
            hint="Indirizzo neutro mostrato sotto la mappa nella tab Info."
          >
            <Input id="address" name="address" defaultValue={bnb.address} />
          </FieldRow>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldRow
              label="Telefono host"
              htmlFor="host_phone"
              hint="Per il pulsante Chiama (formato tel:), es. +39333…"
            >
              <Input
                id="host_phone"
                name="host_phone"
                defaultValue={bnb.hostPhone}
                inputMode="tel"
              />
            </FieldRow>
            <FieldRow
              label="WhatsApp host"
              htmlFor="host_whatsapp"
              hint="Solo cifre con prefisso, senza +. Es. 39333…"
            >
              <Input
                id="host_whatsapp"
                name="host_whatsapp"
                defaultValue={bnb.hostWhatsapp}
                inputMode="numeric"
              />
            </FieldRow>
          </div>

          <StatusMessage state={state} />

          <Button
            type="submit"
            disabled={pending}
            className="h-11 gap-2 rounded-2xl bg-terracotta px-5 font-semibold text-primary-foreground hover:bg-terracotta-strong"
          >
            <Save className="size-4" aria-hidden />
            {pending ? "Salvataggio…" : "Salva dati generali"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
