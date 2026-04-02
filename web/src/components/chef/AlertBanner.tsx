"use client";

import type { AlertSummary } from "@/types/domain";

interface AlertBannerProps {
  summary: AlertSummary;
}

export function AlertBanner({ summary }: AlertBannerProps) {
  const hasAlerts =
    summary.critical > 0 ||
    summary.low > 0 ||
    summary.offline > 0 ||
    summary.stale > 0;

  if (!hasAlerts) {
    return (
      <div className="bg-green-900 border border-green-700 rounded-xl px-6 py-3 flex items-center gap-3">
        <span className="text-green-400 text-xl">✓</span>
        <span className="text-green-100 font-semibold text-lg">All trays healthy</span>
      </div>
    );
  }

  const parts: string[] = [];
  if (summary.critical > 0)
    parts.push(`${summary.critical} critical`);
  if (summary.low > 0)
    parts.push(`${summary.low} low`);
  if (summary.offline > 0)
    parts.push(`${summary.offline} offline`);
  if (summary.stale > 0)
    parts.push(`${summary.stale} stale`);

  const borderColor = summary.critical > 0 ? "border-red-600" : "border-amber-600";
  const bgColor = summary.critical > 0 ? "bg-red-950" : "bg-amber-950";
  const textColor = summary.critical > 0 ? "text-red-100" : "text-amber-100";
  const iconColor = summary.critical > 0 ? "text-red-400" : "text-amber-400";

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl px-6 py-3 flex items-center gap-3`}>
      <span className={`${iconColor} text-xl`}>⚠</span>
      <span className={`${textColor} font-bold text-lg uppercase tracking-wide`}>
        {parts.join(" · ")}
      </span>
    </div>
  );
}
