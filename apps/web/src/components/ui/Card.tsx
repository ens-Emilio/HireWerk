import * as React from "react";
import { cn } from "@/lib/cn";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
};

const paddings = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

export function Card({ className, padding = "md", hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-md border shadow-sm",
        "border-[var(--color-border)] bg-white text-black",
        hover && "transition-shadow hover:shadow-md",
        paddings[padding],
        className
      )}
      {...props}
    />
  );
}

export default Card;
