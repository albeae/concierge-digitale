"use client";

import { useEffect, useState } from "react";
/* eslint-disable @next/next/no-img-element */
import { BottomNav, type TabId } from "@/components/bottom-nav";
import { ExploreTab } from "@/components/explore-tab";
import { HomeTab } from "@/components/home-tab";
import { InfoTab } from "@/components/info-tab";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ui } from "@/lib/i18n";
import { resolveLocalized } from "@/lib/localize";
import type { Bnb, Locale, Place } from "@/types";

interface BnbGuideProps {
  bnb: Bnb;
  places: Place[];
}

export function BnbGuide({ bnb, places }: BnbGuideProps) {
  const [locale, setLocale] = useState<Locale>("it");
  const [tab, setTab] = useState<TabId>("home");
  const t = ui[locale];

  // Allinea l'attributo lang dell'HTML alla lingua scelta (screen reader, ecc.).
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Lingua scelta con fallback per-chiave su "en" se manca qualcosa in "it".
  const content = resolveLocalized(bnb.content, locale);
  const location = resolveLocalized(bnb.location, locale);

  // Anteprima in Home: i primi posti "food" (non i servizi).
  const previewPlaces = places
    .filter((p) => p.category !== "servizio")
    .slice(0, 3);

  return (
    <ThemeProvider
      theme={bnb.theme}
      className="mx-auto flex min-h-full w-full max-w-md flex-col bg-background"
    >
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-terracotta px-5 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-primary-foreground shadow-header">
        <div className="flex min-w-0 items-center gap-2.5">
          {bnb.theme.logoUrl && (
            <img
              src={bnb.theme.logoUrl}
              alt=""
              className="size-9 shrink-0 rounded-xl"
            />
          )}
          <span className="truncate text-lg font-bold tracking-tight">
            {bnb.name}
          </span>
        </div>
        <LanguageToggle
          locale={locale}
          onChange={setLocale}
          label={t.languageLabel}
        />
      </header>

      <main className="flex-1 px-4 pt-7">
        {tab === "home" && (
          <HomeTab
            bnbId={bnb.id}
            content={content}
            theme={bnb.theme}
            locale={locale}
            t={t}
            previewPlaces={previewPlaces}
            onSeeAll={() => setTab("explore")}
            hostPhone={bnb.hostPhone}
            hostWhatsapp={bnb.hostWhatsapp}
          />
        )}
        {tab === "explore" && (
          <ExploreTab places={places} locale={locale} t={t} />
        )}
        {tab === "info" && (
          <InfoTab
            content={content}
            location={location}
            toggles={bnb.toggles}
            places={places}
            locale={locale}
            t={t}
            address={bnb.address}
            hostPhone={bnb.hostPhone}
            hostWhatsapp={bnb.hostWhatsapp}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} t={t.tabs} />
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
