import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TabNav } from "@/components/manage/TabNav";

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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-white text-xl font-black tracking-wide">
            Tray Monitor
          </h1>
          <span className="text-gray-700 text-sm select-none">·</span>
          <span className="text-gray-400 text-sm font-medium">Management</span>
          <Link
            href="/chef"
            className="text-gray-400 hover:text-white text-sm border border-gray-700 hover:border-gray-500 px-3 py-1 rounded-lg transition-all duration-150 active:scale-95"
          >
            → Chef View
          </Link>
        </div>
        <div className="text-right">
          <p className="text-gray-300 text-sm font-medium">
            {profile?.display_name ?? user.email}
          </p>
          <p className="text-gray-600 text-xs capitalize mt-0.5">{profile?.role}</p>
        </div>
      </header>

      {/* Tab navigation */}
      <TabNav />

      {/* Tab content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
