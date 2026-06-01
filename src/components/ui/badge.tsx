import * as React from "react";
import { cn } from "@/lib/utils";
import type { BadgeColor } from "@/lib/constants";

const colorClass: Record<BadgeColor, string> = {
  gray: "badge-gray",
  blue: "badge-blue",
  green: "badge-green",
  amber: "badge-amber",
  red: "badge-red",
  purple: "badge-purple",
  teal: "badge-teal",
};

export function Badge({
  color = "gray",
  className,
  children,
}: {
  color?: BadgeColor;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClass[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
