"use client";

import type { UserProfile } from "@/types/domain";
import type { UserRole } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const ROLE_LABELS: Record<UserRole, string> = {
  chef:             "Chef",
  kitchen_manager:  "Kitchen Manager",
  procurement:      "Procurement",
  fb_director:      "F&B Director",
  admin:            "Admin",
};

const ROLE_COLOR: Record<UserRole, string> = {
  chef:             "text-green-400",
  kitchen_manager:  "text-blue-400",
  procurement:      "text-purple-400",
  fb_director:      "text-amber-400",
  admin:            "text-red-400",
};

interface UserManagementTableProps {
  users: UserProfile[];
}

export function UserManagementTable({ users: initialUsers }: UserManagementTableProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const supabase = createClient();

  async function updateRole(userId: string, role: UserRole) {
    const { data } = await supabase
      .from("user_profiles")
      .update({ role })
      .eq("user_id", userId)
      .select()
      .single();

    if (data) {
      setUsers((prev) => prev.map((u) => (u.user_id === data.user_id ? data : u)));
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Role</th>
            <th className="px-4 py-3 text-left">Member Since</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {users.map((u) => (
            <tr key={u.user_id} className="bg-gray-950 hover:bg-gray-900">
              <td className="px-4 py-3 text-white font-medium">{u.display_name}</td>
              <td className="px-4 py-3">
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u.user_id, e.target.value as UserRole)}
                  className={`rounded-md bg-gray-800 border border-gray-700 px-2 py-1 text-xs ${ROLE_COLOR[u.role]}`}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {new Date(u.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-600">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
