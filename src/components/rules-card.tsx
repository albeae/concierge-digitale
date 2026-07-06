import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RECYCLING_BINS } from "@/lib/recycling";
import type { UiStrings } from "@/lib/i18n";
import type { HouseRule } from "@/types";

interface RulesCardProps {
  rules: HouseRule[];
  recycling: UiStrings["recycling"];
}

export function RulesCard({ rules, recycling }: RulesCardProps) {
  return (
    <Card className="py-0">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-start gap-4 px-5 py-4">
              <span
                className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-2xl"
                aria-hidden
              >
                {rule.icon}
              </span>
              <p className="pt-1 text-base leading-relaxed text-foreground">
                {rule.text}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-border bg-secondary/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {recycling.title}
          </p>
          <ul className="mt-3 space-y-2.5">
            {RECYCLING_BINS.map((bin) => (
              <li key={bin.key} className="flex items-center gap-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: bin.color }}
                >
                  <Trash2 className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {recycling.bins[bin.key]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
