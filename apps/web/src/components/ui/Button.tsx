"use client";
import * as React from "react";
import { cn } from "@/lib/cn";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const base =
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    // CTA principal: azul
    "bg-primary text-primary-foreground hover:bg-[--color-primary-hover] focus-visible:ring-primary ring-offset-background",
  secondary:
    // Ação secundária: cinza neutro
    "bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:ring-secondary ring-offset-background",
  outline:
    // Neutro com borda
    "border border-border bg-transparent text-foreground hover:bg-foreground/10 focus-visible:ring-primary ring-offset-background",
  ghost:
    // Texto/ícone com hover sutil
    "bg-transparent hover:bg-foreground/10 text-foreground focus-visible:ring-primary ring-offset-background",
  danger:
    // Ações destrutivas
    "bg-red-600 text-white hover:bg-red-600/90 focus-visible:ring-red-600 ring-offset-background",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-2 text-xs",
  md: "h-9 px-3 text-sm",
  lg: "h-12 px-5 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export default Button;
