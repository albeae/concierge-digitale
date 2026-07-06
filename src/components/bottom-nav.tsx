import { Compass, House, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UiStrings } from "@/lib/i18n";

export type TabId = "home" | "explore" | "info";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  t: UiStrings["tabs"];
}

export function BottomNav({ active, onChange, t }: BottomNavProps) {
  const items: { id: TabId; icon: LucideIcon; label: string }[] = [
    { id: "home", icon: House, label: t.home },
    { id: "explore", icon: Compass, label: t.explore },
    { id: "info", icon: Info, label: t.info },
  ];

  return (
    <nav className="sticky bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur">
      <ul className="flex">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2.5 text-xs font-medium transition-colors",
                  isActive ? "text-terracotta" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-6" aria-hidden />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
