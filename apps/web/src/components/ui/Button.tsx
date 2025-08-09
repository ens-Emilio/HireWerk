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
    "bg-accent text-white hover:bg-accent/90 focus-visible:ring-accent ring-offset-background",
  secondary:
    "bg-secondary text-primary-foreground hover:bg-secondary/90 focus-visible:ring-secondary ring-offset-background",
  outline:
    "border border-secondary/60 bg-transparent text-foreground hover:bg-secondary/10 focus-visible:ring-secondary ring-offset-background",
  ghost:
    "bg-transparent hover:bg-secondary/10 text-foreground focus-visible:ring-secondary ring-offset-background",
  danger:
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
