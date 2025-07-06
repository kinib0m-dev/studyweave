import { z } from "zod";

export const getUsersStatsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.enum(["active", "suspended", "deleted"]).optional(),
  emailStatus: z.enum(["pending", "confirmed", "expired"]).optional(),
});

export const getActivityLogSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(100),
  userId: z.string().optional(),
  ipAddress: z.string().optional(),
  success: z.boolean().optional(),
});

export const suspendUserSchema = z.object({
  userId: z.string(),
  reason: z.string().optional(),
});

export const updateUserStatusSchema = z.object({
  userId: z.string(),
  status: z.enum(["active", "suspended", "deleted"]),
});

export type GetUsersInput = z.infer<typeof getUsersStatsSchema>;
export type GetActivityLogInput = z.infer<typeof getActivityLogSchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  suspendedUsers: number;
  usersByStatus: Record<string, number>;
  usersByEmailStatus: Record<string, number>;
  totalLogins: number;
  failedLogins: number;
  successRate: number;
}

export interface UserWithStats {
  id: string;
  name: string | null;
  email: string | null;
  accountStatus: "active" | "suspended" | "deleted";
  emailStatus: "pending" | "confirmed" | "expired";
  emailVerified: Date | null;
  isTwoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  image: string | null;
  lastLogin: Date | null;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  ipAddress: string;
  userAgent: string | null;
  success: boolean;
  createdAt: Date;
}
