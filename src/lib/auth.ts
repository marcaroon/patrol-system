// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-me-in-production",
);

export const COOKIE_NAME = "patrol_admin_token";

export type AdminRoleType =
  | "SUPER_ADMIN"
  | "VIEWER"
  | "SECURITY_ADMIN"
  | "HSE_ADMIN";

export interface AdminPayload {
  id: string;
  username: string;
  role: AdminRoleType;
}

/** Returns true if the role has access to Security reports/data */
export function canAccessSecurity(role: AdminRoleType): boolean {
  return (
    role === "SUPER_ADMIN" || role === "VIEWER" || role === "SECURITY_ADMIN"
  );
}

/** Returns true if the role has access to HSE reports/data */
export function canAccessHSE(role: AdminRoleType): boolean {
  return role === "SUPER_ADMIN" || role === "VIEWER" || role === "HSE_ADMIN";
}

/** Returns true if the role can mutate data (create/update/delete) */
export function canMutate(role: AdminRoleType): boolean {
  return (
    role === "SUPER_ADMIN" || role === "SECURITY_ADMIN" || role === "HSE_ADMIN"
  );
}

/** Returns true if the role is a super admin */
export function isSuperAdmin(role: AdminRoleType): boolean {
  return role === "SUPER_ADMIN";
}

/** Get the default dashboard path for a given role */
export function getDefaultDashboard(role: AdminRoleType): string {
  switch (role) {
    case "SECURITY_ADMIN":
      return "/admin/security";
    case "HSE_ADMIN":
      return "/admin/hse";
    default:
      return "/admin/dashboard";
  }
}

export async function signToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("patrol_admin_token");
  if (!token) return null;
  return verifyToken(token.value);
}
