"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Persistent Manage ↔ Chef view toggle.
 * Rendered in both the management header AND the chef header so admins and
 * F&B directors can flip back and forth on either screen.
 *
 * Role-gating is handled by the parent (only mounted when canSwitchViews()).
 */
export function ViewToggle({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const onChef = pathname?.startsWith("/chef");

  return (
    <div
      role="tablist"
      aria-label="Switch view"
      className={[
        "inline-flex items-center rounded-md p-0.5 border border-ink-3 bg-ink-2",
        className,
      ].join(" ")}
    >
      <Pill href="/manage/config" label="Manage" active={!onChef} />
      <Pill href="/chef"          label="Chef"   active={!!onChef} />
    </div>
  );
}

function Pill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={[
        "inline-flex items-center h-7 px-3 rounded text-[12px] font-semibold",
        "transition-colors duration-150",
        active
          ? "bg-ink-4 text-ink-8 shadow-sm"
          : "text-ink-6 hover:text-ink-8 hover:bg-ink-3",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
