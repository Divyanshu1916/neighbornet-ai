import type { User } from "firebase/auth";

export const ADMIN_EMAIL = "pcm28755@gmail.com";

export function isAdmin(user: { email?: string | null } | User | null | undefined): boolean {
  return !!user?.email && user.email.toLowerCase() === ADMIN_EMAIL;
}
