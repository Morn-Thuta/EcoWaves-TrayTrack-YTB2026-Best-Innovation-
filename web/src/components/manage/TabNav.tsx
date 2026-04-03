"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/manage/config",       label: "Config",      icon: "⚙" },
  { href: "/manage/guests",       label: "Guests",      icon: "👥" },
  { href: "/manage/procurement",  label: "Procurement", icon: "🛒" },
  { href: "/manage/analytics",    label: "Analytics",   icon: "📊" },
  { href: "/manage/admin",        label: "Admin",       icon: "🔧" },
  { href: "/manage/import",       label: "Import",      icon: "📁" },
];

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6">
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "text-white border-green-500"
                  : "text-gray-400 hover:text-white border-transparent hover:border-gray-500"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
