import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TabNav } from "@/components/manage/TabNav";
import { TutorialButton } from "@/components/manage/TutorialButton";
import { BrandMark } from "@/components/manage/BrandMark";

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, display_name")
    .eq("user_id", user.id)
    .single();

  if (profile?.role === "chef") redirect("/chef");

  const displayName = profile?.display_name ?? user.email ?? "—";
  const initials =
    (displayName.match(/\b\w/g) ?? []).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-ink-0 text-ink-8 flex flex-col">
      {/* ── Header — 56px, brand left, ⌘K + user right ─────────────────── */}
      <header className="scanline bg-ink-1 h-14 px-6 flex items-center justify-between flex-shrink-0">
        {/* Brand cluster */}
        <div className="flex items-center gap-3">
          <BrandMark size={22} />
          <span className="text-ink-8 text-base font-semibold tracking-tight">
            Tray Monitor
          </span>

          {/* Live pulse dot — signals real-time data */}
          <span className="flex items-center gap-1.5 ml-2 pl-3 border-l border-ink-4">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent animate-live-pulse" />
            </span>
            <span className="text-ink-6 text-xs font-medium tracking-wide">LIVE</span>
          </span>
        </div>

        {/* Right cluster: ⌘K hint, Chef View, Tour, User avatar */}
        <div className="flex items-center gap-3">
          {/* ⌘K hint — visual signal that this app has a command palette */}
          <kbd
            className="hidden sm:inline-flex items-center gap-1 px-2 h-7 rounded-md bg-ink-2 border border-ink-4 text-ink-6 text-[11px] font-mono tracking-wide select-none"
            title="Command palette (coming soon)"
          >
            <span className="text-sm leading-none">⌘</span>
            <span>K</span>
          </kbd>

          {/* Chef View — secondary link, unified button language */}
          <Link
            id="tour-chef-view-link"
            href="/chef"
            className="inline-flex items-center h-8 px-3 rounded-md border border-ink-4 hover:border-ink-5 text-ink-7 hover:text-ink-8 text-sm font-medium transition-colors duration-150 active:scale-95"
          >
            Chef View
            <span className="ml-1.5 text-ink-6">→</span>
          </Link>

          <TutorialButton />

          {/* User avatar chip */}
          <div className="flex items-center gap-2 pl-3 border-l border-ink-4">
            <div
              className="h-7 w-7 rounded-full bg-ink-3 border border-ink-4 flex items-center justify-center text-ink-8 text-[11px] font-semibold tracking-tight"
              aria-label={displayName}
            >
              {initials}
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-ink-8 text-[13px] font-medium">{displayName}</span>
              <span className="text-ink-6 text-[11px] capitalize">{profile?.role ?? ""}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab navigation — pill-style */}
      <TabNav />

      {/* Tab content */}
      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
