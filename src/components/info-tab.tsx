import {
  Clock,
  Coffee,
  CookingPot,
  LogOut,
  MapPin,
  Phone,
  ScrollText,
  Sparkles,
  SquareParking,
  type LucideIcon,
} from "lucide-react";
import { EmergencyCard } from "@/components/emergency-card";
import { MapEmbed } from "@/components/map-embed";
import { RulesCard } from "@/components/rules-card";
import { SectionHeading } from "@/components/section-heading";
import { TransportBlocks } from "@/components/transport-blocks";
import { Card, CardContent } from "@/components/ui/card";
import type { UiStrings } from "@/lib/i18n";
import type { BnbContent, BnbLocation, BnbToggles, Locale, Place } from "@/types";

interface InfoTabProps {
  content: BnbContent;
  location: BnbLocation;
  toggles: BnbToggles;
  places: Place[];
  locale: Locale;
  t: UiStrings;
}

/** Farmacia più vicina fra i posti (categoria servizio), per la card Emergenze. */
function findPharmacy(places: Place[]): Place | undefined {
  return places.find((p) => {
    if (p.category !== "servizio") return false;
    const name = `${p.name.en} ${p.name.it ?? ""}`.toLowerCase();
    return name.includes("farmacia") || name.includes("pharmacy");
  });
}

// Indirizzo finto placeholder: da collegare al dato reale del B&B più avanti.
const ADDRESS = "Via della Lungaretta 42, Trastevere, Roma";

function AmenityCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-4 p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary">
          <Icon className="size-6 text-terracotta" aria-hidden />
        </span>
        <div className="min-w-0">
          <h4 className="text-base font-semibold">{title}</h4>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function InfoTab({
  content,
  location,
  toggles,
  places,
  locale,
  t,
}: InfoTabProps) {
  const hasAnyAmenity =
    toggles.hasKitchen || toggles.hasParking || toggles.offersBreakfast;
  const pharmacy = findPharmacy(places);

  return (
    <div className="space-y-8 pb-6">
      {/* Emergenze: numeri utili sempre in evidenza in cima alla tab */}
      <EmergencyCard t={t.emergency} locale={locale} pharmacy={pharmacy} />

      {/* Check-in / Check-out */}
      <Card className="py-0">
        <CardContent className="divide-y divide-border p-0">
          {[
            { icon: Clock, label: t.info.checkIn, value: content.checkIn },
            { icon: LogOut, label: t.info.checkOut, value: content.checkOut },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary">
                <row.icon className="size-5 text-terracotta" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </p>
                <p className="text-base font-semibold">{row.value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Regole della casa + raccolta differenziata */}
      <section className="space-y-3">
        <SectionHeading icon={ScrollText}>{t.rules.title}</SectionHeading>
        <RulesCard rules={content.houseRules} recycling={t.recycling} />
      </section>

      {/* Servizi: ogni card è renderizzata SOLO se il toggle è true */}
      {hasAnyAmenity && (
        <section className="space-y-3">
          <SectionHeading icon={Sparkles}>{t.info.servicesTitle}</SectionHeading>
          <div className="space-y-3">
            {toggles.hasKitchen && (
              <AmenityCard
                icon={CookingPot}
                title={t.amenities.kitchen}
                description={t.amenities.kitchenDesc}
              />
            )}
            {toggles.hasParking && (
              <AmenityCard
                icon={SquareParking}
                title={t.amenities.parking}
                description={t.amenities.parkingDesc}
              />
            )}
            {toggles.offersBreakfast && (
              <AmenityCard
                icon={Coffee}
                title={t.amenities.breakfast}
                description={t.amenities.breakfastDesc}
              />
            )}
          </div>
        </section>
      )}

      {/* Location & Trasporti */}
      <section className="space-y-3">
        <SectionHeading icon={MapPin}>{t.transport.title}</SectionHeading>
        <MapEmbed address={ADDRESS} ariaLabel={t.transport.mapAria} />
        <p className="flex items-center gap-1.5 px-1 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {ADDRESS}
        </p>
        <TransportBlocks location={location} t={t.transport} />
      </section>

      {/* Contatti */}
      <section className="space-y-3">
        <SectionHeading icon={Phone}>{t.info.contactTitle}</SectionHeading>
        <Card className="py-0">
          <CardContent className="p-5">
            <p className="text-base leading-relaxed text-muted-foreground">
              {t.info.contactBody}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
