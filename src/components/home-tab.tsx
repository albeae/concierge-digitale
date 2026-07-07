import { UtensilsCrossed } from "lucide-react";
import { HomeWidgets } from "@/components/home-widgets";
import { PlaceCard } from "@/components/place-card";
import { QuickActions } from "@/components/quick-actions";
import { ReviewModule } from "@/components/review-module";
import { SectionHeading } from "@/components/section-heading";
import { WifiCard } from "@/components/wifi-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UiStrings } from "@/lib/i18n";
import type { BnbContent, BnbTheme, Locale, Place } from "@/types";

interface HomeTabProps {
  content: BnbContent;
  theme: BnbTheme;
  locale: Locale;
  t: UiStrings;
  previewPlaces: Place[];
  onSeeAll: () => void;
  /** Contatti host, dal database (bnb_clients.host_phone / host_whatsapp). */
  hostPhone: string;
  hostWhatsapp: string;
}

export function HomeTab({
  content,
  theme,
  locale,
  t,
  previewPlaces,
  onSeeAll,
  hostPhone,
  hostWhatsapp,
}: HomeTabProps) {
  return (
    <div className="space-y-8 pb-6">
      {/* 1. Messaggio di benvenuto (logo + lingua stanno nell'header). */}
      <p className="text-base leading-relaxed text-foreground">
        {content.welcomeMessage}
      </p>

      {/* 2. Hero image arrotondata. */}
      {theme.heroImage ? (
        <div
          role="img"
          aria-label={t.tabs.home}
          className="aspect-[16/10] w-full rounded-3xl bg-cover bg-center shadow-raised"
          style={{ backgroundImage: `url(${theme.heroImage})` }}
        />
      ) : (
        <div className="aspect-[16/10] w-full rounded-3xl bg-gradient-to-br from-terracotta to-ochre shadow-raised" />
      )}

      {/* 3. Widget affiancati: meteo + ora locale. */}
      <HomeWidgets t={t.widgets} />

      {/* 4. Wi-Fi in evidenza. */}
      <WifiCard
        networkName={content.wifiNetworkName}
        password={content.wifiPassword}
        t={t.wifi}
      />

      {/* 5. Azioni rapide. */}
      <QuickActions
        t={t.actions}
        hostPhone={hostPhone}
        hostWhatsapp={hostWhatsapp}
      />

      {/* 6. Modulo recensione. */}
      <ReviewModule t={t.review} />

      {/* 7. Anteprima "Dove mangiare" (feed completo nella tab Esplora). */}
      {previewPlaces.length > 0 && (
        <section className="space-y-3">
          <SectionHeading
            icon={UtensilsCrossed}
            action={
              <button
                type="button"
                onClick={onSeeAll}
                className="text-sm font-semibold text-terracotta"
              >
                {t.places.seeAll}
              </button>
            }
          >
            {t.places.previewTitle}
          </SectionHeading>

          <div className="space-y-3">
            {previewPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                locale={locale}
                t={t.places}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onSeeAll}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 w-full rounded-2xl text-base font-medium",
            )}
          >
            {t.places.seeAll}
          </button>
        </section>
      )}
    </div>
  );
}
