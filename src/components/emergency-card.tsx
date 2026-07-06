import { ChevronRight, Cross, Phone, Siren } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EMERGENCY_NUMBER, HOST_PHONE, telUrl } from "@/lib/contacts";
import { pick } from "@/lib/localize";
import type { UiStrings } from "@/lib/i18n";
import type { Locale, Place } from "@/types";

interface EmergencyCardProps {
  t: UiStrings["emergency"];
  locale: Locale;
  /** Farmacia più vicina, ricavata dai posti (categoria servizio). Opzionale. */
  pharmacy?: Place;
}

/** Riga tappabile: icona + testo + freccia, tap target ampio. */
function Row({
  href,
  external,
  tint,
  icon,
  label,
  value,
}: {
  href: string;
  external?: boolean;
  tint: "danger" | "brand";
  icon: React.ReactNode;
  /** Caption piccola sopra il valore (facoltativa). */
  label?: string;
  value: string;
}) {
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="flex items-center gap-3 px-5 py-4 transition-colors active:bg-secondary/50"
    >
      <span
        className={
          tint === "danger"
            ? "grid size-10 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive"
            : "grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-terracotta"
        }
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        {label && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        )}
        <p className="truncate text-base font-semibold">{value}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </a>
  );
}

export function EmergencyCard({ t, locale, pharmacy }: EmergencyCardProps) {
  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 px-5 pb-3 pt-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-destructive/10">
            <Siren className="size-5 text-destructive" aria-hidden />
          </span>
          <div className="min-w-0">
            <h4 className="text-base font-semibold">{t.title}</h4>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        <div className="divide-y divide-border">
          <Row
            href={telUrl(EMERGENCY_NUMBER)}
            tint="danger"
            icon={<Phone className="size-5" aria-hidden />}
            label={t.emergencyNumber}
            value={EMERGENCY_NUMBER}
          />
          <Row
            href={telUrl(HOST_PHONE)}
            tint="brand"
            icon={<Phone className="size-5" aria-hidden />}
            value={t.callHost}
          />
          {pharmacy && (
            <Row
              href={pharmacy.googleMapsUrl}
              external
              tint="brand"
              icon={<Cross className="size-5" aria-hidden />}
              label={t.pharmacy}
              value={pick(pharmacy.name, locale)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
