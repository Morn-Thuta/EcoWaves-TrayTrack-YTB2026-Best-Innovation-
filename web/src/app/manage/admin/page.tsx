import { createClient } from "@/lib/supabase/server";
import { SensorStatusTable } from "@/components/manage/SensorStatusTable";
import { UserManagementTable } from "@/components/manage/UserManagementTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: sensors }, { data: users }] = await Promise.all([
    supabase
      .from("sensors")
      .select("*, trays(tray_name, dishes(name))")
      .order("created_at"),
    supabase
      .from("user_profiles")
      .select("*")
      .order("created_at"),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-white text-xl font-bold mb-4">Sensor Status</h2>
        <SensorStatusTable sensors={sensors ?? []} />
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-4">User Management</h2>
        <UserManagementTable users={users ?? []} />
      </section>
    </div>
  );
}
