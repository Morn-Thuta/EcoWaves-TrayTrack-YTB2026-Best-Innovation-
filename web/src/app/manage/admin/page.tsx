import { createClient } from "@/lib/supabase/server";
import { SensorStatusTable } from "@/components/manage/SensorStatusTable";
import { UserManagementTable } from "@/components/manage/UserManagementTable";

export const dynamic = "force-dynamic";

// Feature flag: User Management isn't ready for demo — Invite/Remove flows
// still need implementation. Set NEXT_PUBLIC_FEATURE_USER_MGMT=true to enable.
const SHOW_USER_MGMT = process.env.NEXT_PUBLIC_FEATURE_USER_MGMT === "true";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: sensors }, { data: users }] = await Promise.all([
    supabase
      .from("sensors")
      .select("*, trays!fk_sensors_tray(tray_name, dishes(name))")
      .order("created_at"),
    SHOW_USER_MGMT
      ? supabase.from("user_profiles").select("*").order("created_at")
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-ink-8 text-lg font-semibold tracking-tight mb-4">
          Sensor Status
        </h2>
        <SensorStatusTable sensors={sensors ?? []} />
      </section>

      {SHOW_USER_MGMT && (
        <section>
          <h2 className="text-ink-8 text-lg font-semibold tracking-tight mb-4">
            User Management
          </h2>
          <UserManagementTable users={users ?? []} />
        </section>
      )}
    </div>
  );
}
