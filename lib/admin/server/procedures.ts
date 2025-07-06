import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ratelimit } from "@/lib/utils/ratelimit";
import {
  getUsersStatsSchema,
  suspendUserSchema,
  updateUserStatusSchema,
  getActivityLogSchema,
} from "../validation/schemas";
import {
  getUsersWithStats,
  getUserActivityLog,
  suspendUser,
  updateUserStatus,
  getSystemStats,
} from "./queries";
import z from "zod";

const ADMIN_EMAIL = "kinib0m.dev@gmail.com";

export const adminProcedure = baseProcedure.use(async function isAdmin(opts) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Check if user is admin
  if (user.email !== ADMIN_EMAIL) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Admin privileges required.",
    });
  }

  // Rate limiting for admin actions
  const { success } = await ratelimit.limit(`admin:${user.id}`);
  if (!success) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      user,
      isAdmin: true,
    },
  });
});

export const adminRouter = createTRPCRouter({
  // Get system statistics
  getSystemStats: adminProcedure.query(async () => {
    return await getSystemStats();
  }),

  // Get users with pagination and filtering
  getUsers: adminProcedure
    .input(getUsersStatsSchema)
    .query(async ({ input }) => {
      return await getUsersWithStats(input);
    }),

  // Get activity log
  getActivityLog: adminProcedure
    .input(getActivityLogSchema)
    .query(async ({ input }) => {
      return await getUserActivityLog(input);
    }),

  // Suspend user
  suspendUser: adminProcedure
    .input(suspendUserSchema)
    .mutation(async ({ input }) => {
      return await suspendUser(input.userId, input.reason);
    }),

  // Update user status
  updateUserStatus: adminProcedure
    .input(updateUserStatusSchema)
    .mutation(async ({ input }) => {
      return await updateUserStatus(input.userId, input.status);
    }),

  // Get user details
  getUserDetails: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),
});
