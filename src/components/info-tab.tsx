import {
  Clock,
  Coffee,
  CookingPot,
  LogOut,
  MapPin,
  MessageCircle,
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
import { telUrl, whatsappUrl } from "@/lib/contacts";
import type { UiStrings } from "@/lib/i18n";
import type { BnbContent, BnbLocation, BnbToggles, Locale, Place } from "@/types";

interface InfoTabProps {
  content: BnbContent;
  location: BnbLocation;
  toggles: BnbToggles;
  places: Place[];
  locale: Locale;
  t: UiStrings;
  /** Indirizzo e contatti host, dal database (colonne di bnb_clients). */
  address: string;
  hostPhone: string;
  hostWhatsapp: string;
}

/** Farmacia più vicina fra i posti (categoria servizio), per la card Emergenze. */
function findPharmacy(places: Place[]): Place | undefined {
  return places.find((p) => {
    if (p.category !== "servizio") return false;
    const name = `${p.name.en} ${p.name.it ?? ""}`.toLowerCase();
    return name.includes("farmacia") || name.includes("pharmacy");
  });
}

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
  address,
  hostPhone,
  hostWhatsapp,
}: InfoTabProps) {
  const hasAnyAmenity =
    toggles.hasKitchen || toggles.hasParking || toggles.offersBreakfast;
  const pharmacy = findPharmacy(places);

  return (
    <div className="space-y-8 pb-6">
      {/* Emergenze: numeri utili sempre in evidenza in cima alla tab */}
      <EmergencyCard
        t={t.emergency}
        locale={locale}
        hostPhone={hostPhone}
        pharmacy={pharmacy}
      />

      {/* Check-in / Check-out: orario + eventuali istruzioni (arrivo, self
          check-in, chiavi). Il blocco istruzioni compare solo se compilato. */}
      <Card className="py-0">
        <CardContent className="divide-y divide-border p-0">
          {[
            {
              icon: Clock,
              label: t.info.checkIn,
              value: content.checkIn,
              detailsLabel: t.info.checkInDetails,
              details: content.checkInInstructions,
            },
            {
              icon: LogOut,
              label: t.info.checkOut,
              value: content.checkOut,
              detailsLabel: t.info.checkOutDetails,
              details: content.checkOutInstructions,
            },
          ].map((row) => (
            <div key={row.label} className="px-5 py-4">
              <div className="flex items-center gap-3">
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
              {row.details && (
                <div className="mt-3 rounded-2xl bg-secondary/50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {row.detailsLabel}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
                    {row.details}
                  </p>
                </div>
              )}
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
        <MapEmbed address={address} ariaLabel={t.transport.mapAria} />
        <p className="flex items-center gap-1.5 px-1 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {address}
        </p>
        <TransportBlocks location={location} t={t.transport} />
      </section>

      {/* Contatti: testo + righe tappabili con i contatti reali dell'host */}
      <section className="space-y-3">
        <SectionHeading icon={Phone}>{t.info.contactTitle}</SectionHeading>
        <Card className="py-0">
          <CardContent className="p-0">
            <p className="px-5 pb-3 pt-5 text-base leading-relaxed text-muted-foreground">
              {t.info.contactBody}
            </p>
            <div className="divide-y divide-border">
              <a
                href={whatsappUrl(hostWhatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-4 transition-colors active:bg-secondary/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary">
                  <MessageCircle className="size-5 text-terracotta" aria-hidden />
                </span>
                <p className="min-w-0 flex-1 truncate text-base font-semibold">
                  {t.actions.whatsapp}
                </p>
              </a>
              <a
                href={telUrl(hostPhone)}
                className="flex items-center gap-3 px-5 py-4 transition-colors active:bg-secondary/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary">
                  <Phone className="size-5 text-terracotta" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.actions.call}
                  </p>
                  <p className="truncate text-base font-semibold">{hostPhone}</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
