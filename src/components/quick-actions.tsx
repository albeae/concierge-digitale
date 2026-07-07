import { MessageCircle, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { telUrl, whatsappUrl } from "@/lib/contacts";
import type { UiStrings } from "@/lib/i18n";

interface QuickActionsProps {
  t: UiStrings["actions"];
  /** Contatti host, dal database (bnb_clients.host_phone / host_whatsapp). */
  hostPhone: string;
  hostWhatsapp: string;
}

export function QuickActions({ t, hostPhone, hostWhatsapp }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <a
        href={whatsappUrl(hostWhatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: "default" }),
          "h-14 gap-2 rounded-2xl bg-terracotta text-base font-semibold text-primary-foreground hover:bg-terracotta-strong",
        )}
      >
        <MessageCircle className="size-5" aria-hidden />
        {t.whatsapp}
      </a>
      <a
        href={telUrl(hostPhone)}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-14 gap-2 rounded-2xl text-base font-semibold",
        )}
      >
        <Phone className="size-5" aria-hidden />
        {t.call}
      </a>
    </div>
  );
}
