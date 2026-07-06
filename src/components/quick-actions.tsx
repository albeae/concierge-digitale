import { MessageCircle, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HOST_PHONE, HOST_WHATSAPP, telUrl, whatsappUrl } from "@/lib/contacts";
import type { UiStrings } from "@/lib/i18n";

interface QuickActionsProps {
  t: UiStrings["actions"];
}

// Contatti host (placeholder centralizzati in lib/contacts.ts).
const WHATSAPP_URL = whatsappUrl(HOST_WHATSAPP);
const PHONE_URL = telUrl(HOST_PHONE);

export function QuickActions({ t }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <a
        href={WHATSAPP_URL}
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
        href={PHONE_URL}
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
