export const ADMIN_EMAIL = "kinib0m.dev@gmail.com";

export function isAdmin(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}

export function requireAdmin(email: string | null | undefined): void {
  if (!isAdmin(email)) {
    throw new Error("Admin access required");
  }
}
