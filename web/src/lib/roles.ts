/**
 * Single source of truth for role keys and human-readable labels.
 * Use these everywhere a role is rendered or compared.
 */

export type RoleKey =
  | "admin"
  | "fb_director"
  | "kitchen_manager"
  | "procurement"
  | "chef";

export const ROLE_LABELS: Record<RoleKey, string> = {
  admin:           "Admin",
  fb_director:     "F&B Director",
  kitchen_manager: "Kitchen Manager",
  procurement:     "Procurement",
  chef:            "Chef",
};

export const ROLE_OPTIONS: Array<{ value: RoleKey; label: string }> =
  (Object.keys(ROLE_LABELS) as RoleKey[]).map(value => ({
    value,
    label: ROLE_LABELS[value],
  }));

/** Roles allowed to flip between management and chef views via the ViewToggle. */
const MANAGEMENT_ROLES = new Set<RoleKey>([
  "admin",
  "fb_director",
  "kitchen_manager",
]);

export function canSwitchViews(role: string | null | undefined): boolean {
  return !!role && MANAGEMENT_ROLES.has(role as RoleKey);
}

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABELS[role as RoleKey] ?? role;
}
