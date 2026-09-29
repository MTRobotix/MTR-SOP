/** Minimum password length. Used by the server checks and the forms. */
export const MIN_PASSWORD = 4;

export const ROLES = ["viewer", "editor", "admin"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 };

export function hasRole(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

export type User = { id: number; email: string; name: string; role: Role };
