"use client";

import * as React from "react";

/**
 * Single button component for the whole app — avoids the shadcn Button's
 * bg-primary conflict and gives us one consistent CTA visual language.
 *
 * Variants:
 *   primary     — emerald, for main commit actions
 *   secondary   — outlined, for secondary actions (Cancel, Set end time …)
 *   destructive — red, for delete / remove
 *   ghost       — text only, for inline row actions (Edit …)
 *
 * Sizes:
 *   sm  — h-7  (table rows)
 *   md  — h-9  (default CTAs)
 *   lg  — h-10 (hero buttons)
 */

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size    = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12px]",
  md: "h-9 px-4 text-[13px]",
  lg: "h-10 px-5 text-[14px]",
};

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 " +
  "rounded-md font-semibold transition-colors duration-150 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-ink-0 active:scale-95 " +
  "disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";

/** Inline-style colour blocks so Tailwind's static analyser can't drop them. */
const VARIANT_STYLE: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: "oklch(0.70 0.18 160)",
    color: "oklch(0.09 0.005 240)",
  },
  secondary: {},
  destructive: {
    backgroundColor: "oklch(0.62 0.22 25)",
    color: "oklch(0.98 0.002 240)",
  },
  ghost: {},
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary:     "hover:brightness-110 focus-visible:ring-[oklch(0.70_0.18_160)]/50",
  secondary:   "bg-transparent border border-ink-4 text-ink-7 hover:border-ink-5 hover:text-ink-8",
  destructive: "hover:brightness-110 focus-visible:ring-[oklch(0.62_0.22_25)]/50",
  ghost:       "bg-transparent text-ink-7 hover:bg-ink-3 hover:text-ink-8",
};

export interface AppButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  variant?: Variant;
  size?:    Size;
  /** Optional inline style override (merges over the variant defaults). */
  style?: React.CSSProperties;
}

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  function AppButton(
    {
      variant = "primary",
      size    = "md",
      className = "",
      style,
      children,
      type = "button",
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={`${BASE} ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${className}`}
        style={{ ...VARIANT_STYLE[variant], ...style }}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
