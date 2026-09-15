export const userRoles = [
  "admin",
  "staff",
  "driver",
  "super_admin",
  "central_fleet_manager",
  "fleet_officer",
  "transport_unit",
  "requester",
  "viewer",
] as const;

export type UserRole = (typeof userRoles)[number];

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  campus_id: string | null;
  campus_name: string | null;
  campus_code: string | null;
  campus_city: string | null;
};
