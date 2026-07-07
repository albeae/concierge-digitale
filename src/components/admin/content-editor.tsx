"use client";

import { useActionState, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { updateBnbContent } from "@/app/admin/[bnbId]/actions";
import { FieldRow, Input, Label, Textarea } from "@/components/admin/field";
import { StatusMessage } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Bnb, BnbContent, BnbLocation, Locale } from "@/types";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "it", label: "Italiano" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

function emptyContent(): BnbContent {
  return {
    welcomeMessage: "",
    wifiNetworkName: "",
    wifiPassword: "",
    checkIn: "",
    checkOut: "",
    houseRules: [],
  };
}

function emptyLocation(): BnbLocation {
  return { airport: "", train: "", ztl: "" };
}

/** Clona per non mutare le props (le regole sono un array annidato). */
function cloneContent(c: BnbContent): BnbContent {
  return { ...c, houseRules: c.houseRules.map((r) => ({ ...r })) };
}

function newRuleId() {
  return `rule-${crypto.randomUUID().slice(0, 8)}`;
}

type ByLocale<T> = Record<Locale, T>;

export function ContentEditor({ bnb }: { bnb: Bnb }) {
  const action = updateBnbContent.bind(null, bnb.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  const [lang, setLang] = useState<Locale>("it");
  const [content, setContent] = useState<ByLocale<BnbContent>>(() => ({
    it: bnb.content.it ? cloneContent(bnb.content.it) : emptyContent(),
    en: cloneContent(bnb.content.en),
    es: bnb.content.es ? cloneContent(bnb.content.es) : emptyContent(),
  }));
  const [location, setLocation] = useState<ByLocale<BnbLocation>>(() => ({
    it: bnb.location.it ? { ...bnb.location.it } : emptyLocation(),
    en: { ...bnb.location.en },
    es: bnb.location.es ? { ...bnb.location.es } : emptyLocation(),
  }));

  const c = content[lang];
  const loc = location[lang];

  const setC = (key: keyof Omit<BnbContent, "houseRules">, value: string) =>
    setContent((prev) => ({ ...prev, [lang]: { ...prev[lang], [key]: value } }));

  const setLoc = (key: keyof BnbLocation, value: string) =>
    setLocation((prev) => ({ ...prev, [lang]: { ...prev[lang], [key]: value } }));

  const addRule = () =>
    setContent((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        houseRules: [
          ...prev[lang].houseRules,
          { id: newRuleId(), icon: "", text: "" },
        ],
      },
    }));

  const updateRule = (idx: number, key: "icon" | "text", value: string) =>
    setContent((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        houseRules: prev[lang].houseRules.map((r, i) =>
          i === idx ? { ...r, [key]: value } : r,
        ),
      },
    }));

  const removeRule = (idx: number) =>
    setContent((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        houseRules: prev[lang].houseRules.filter((_, i) => i !== idx),
      },
    }));

  const payload = JSON.stringify({ content, location });

  return (
    <Card>
      <CardContent className="p-5">
        <form action={formAction} className="space-y-5">
          {/* Tutto lo stato multilingua viaggia in questo campo nascosto. */}
          <input type="hidden" name="payload" value={payload} readOnly />

          {/* Tab lingua */}
          <div
            role="tablist"
            aria-label="Lingua"
            className="flex gap-1.5 rounded-2xl bg-secondary/60 p-1"
          >
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="tab"
                aria-selected={lang === l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  "flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                  lang === l.code
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
                {l.code === "en" && (
                  <span className="ml-1 text-xs font-normal opacity-70">
                    (base)
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            L&apos;inglese è la base: le lingue lasciate vuote ripiegano su di
            esso, campo per campo.
          </p>

          <FieldRow label="Messaggio di benvenuto" htmlFor="welcomeMessage">
            <Textarea
              id="welcomeMessage"
              value={c.welcomeMessage}
              onChange={(e) => setC("welcomeMessage", e.target.value)}
            />
          </FieldRow>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldRow
              label="Nome rete Wi-Fi"
              htmlFor="wifiNetworkName"
              hint="Di solito uguale in tutte le lingue."
            >
              <Input
                id="wifiNetworkName"
                value={c.wifiNetworkName}
                onChange={(e) => setC("wifiNetworkName", e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Password Wi-Fi" htmlFor="wifiPassword">
              <Input
                id="wifiPassword"
                value={c.wifiPassword}
                onChange={(e) => setC("wifiPassword", e.target.value)}
              />
            </FieldRow>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldRow label="Check-in" htmlFor="checkIn">
              <Input
                id="checkIn"
                value={c.checkIn}
                onChange={(e) => setC("checkIn", e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Check-out" htmlFor="checkOut">
              <Input
                id="checkOut"
                value={c.checkOut}
                onChange={(e) => setC("checkOut", e.target.value)}
              />
            </FieldRow>
          </div>

          {/* Regole della casa (array dinamico per la lingua attiva) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="mb-0">Regole della casa</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRule}
                className="gap-1 rounded-lg"
              >
                <Plus className="size-4" aria-hidden />
                Aggiungi
              </Button>
            </div>

            {c.houseRules.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nessuna regola in questa lingua.
              </p>
            )}

            <div className="space-y-2">
              {c.houseRules.map((rule, idx) => (
                <div key={rule.id} className="flex items-start gap-2">
                  <Input
                    aria-label="Icona (emoji)"
                    value={rule.icon}
                    onChange={(e) => updateRule(idx, "icon", e.target.value)}
                    className="w-14 shrink-0 text-center text-lg"
                    placeholder="🏠"
                  />
                  <Textarea
                    aria-label="Testo della regola"
                    value={rule.text}
                    onChange={(e) => updateRule(idx, "text", e.target.value)}
                    className="min-h-11"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeRule(idx)}
                    aria-label="Rimuovi regola"
                    className="mt-0.5 shrink-0 rounded-lg"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Trasporti */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Trasporti
            </legend>
            <FieldRow label="In aereo" htmlFor="loc-airport">
              <Textarea
                id="loc-airport"
                value={loc.airport}
                onChange={(e) => setLoc("airport", e.target.value)}
              />
            </FieldRow>
            <FieldRow label="In treno" htmlFor="loc-train">
              <Textarea
                id="loc-train"
                value={loc.train}
                onChange={(e) => setLoc("train", e.target.value)}
              />
            </FieldRow>
            <FieldRow label="In auto / ZTL" htmlFor="loc-ztl">
              <Textarea
                id="loc-ztl"
                value={loc.ztl}
                onChange={(e) => setLoc("ztl", e.target.value)}
              />
            </FieldRow>
          </fieldset>

          <StatusMessage state={state} />

          <Button
            type="submit"
            disabled={pending}
            className="h-11 gap-2 rounded-2xl bg-terracotta px-5 font-semibold text-primary-foreground hover:bg-terracotta-strong"
          >
            <Save className="size-4" aria-hidden />
            {pending ? "Salvataggio…" : "Salva contenuti"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
