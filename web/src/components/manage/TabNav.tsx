"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/manage/config",    label: "Stations"  },
  { href: "/manage/guests",    label: "Service"   },
  { href: "/manage/analytics", label: "Analytics" },
  { href: "/manage/admin",     label: "Admin"     },
];

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-ink-0 px-6 h-11 flex items-center border-b border-ink-3">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "inline-flex items-center h-8 px-3.5 rounded-md text-[13px] font-medium",
                "transition-colors duration-150 whitespace-nowrap",
                isActive
                  ? "bg-ink-3 text-ink-8"
                  : "text-ink-6 hover:text-ink-8 hover:bg-ink-2",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
