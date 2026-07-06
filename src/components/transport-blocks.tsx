import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UiStrings } from "@/lib/i18n";
import type { BnbLocation } from "@/types";

interface TransportBlocksProps {
  location: BnbLocation;
  t: UiStrings["transport"];
}

/** Chiavi fisse, nell'ordine di visualizzazione. "ztl" = blocco "In Auto". */
const KEYS = ["airport", "train", "ztl"] as const;

export function TransportBlocks({ location, t }: TransportBlocksProps) {
  return (
    <div className="space-y-3">
      {KEYS.map((key) => {
        const meta = t.items[key];
        const highlight = key === "ztl";
        return (
          <Card
            key={key}
            className={cn("py-0", highlight && "ring-2 ring-ochre/45")}
          >
            <CardContent className="flex gap-4 p-4">
              <span
                className={cn(
                  "grid size-16 shrink-0 place-items-center rounded-2xl text-4xl",
                  highlight ? "bg-ochre/15" : "bg-secondary",
                )}
                aria-hidden
              >
                {meta.icon}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold">{meta.label}</h4>
                  {highlight && (
                    <Badge className="bg-ochre text-xs text-primary-foreground">
                      {t.ztlBadge}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {location[key]}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
