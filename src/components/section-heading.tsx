import type { LucideIcon } from "lucide-react";

interface SectionHeadingProps {
  icon: LucideIcon;
  children: React.ReactNode;
  /** Slot opzionale a destra (es. link "Vedi tutti"). */
  action?: React.ReactNode;
}

export function SectionHeading({ icon: Icon, children, action }: SectionHeadingProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Icon className="size-5 text-terracotta" aria-hidden />
        {children}
      </h2>
      {action}
    </div>
  );
}
