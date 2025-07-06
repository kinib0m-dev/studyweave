import { db } from "@/db";
import { users, loginActivities } from "@/db/schema";
import { eq, desc, sql, and, gte, count, like, inArray } from "drizzle-orm";
import type {
  GetUsersInput,
  GetActivityLogInput,
  SystemStats,
  UserWithStats,
} from "../validation/schemas";

export async function getSystemStats(): Promise<SystemStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get total users
  const [totalUsersResult] = await db.select({ count: count() }).from(users);

  // Get active users (logged in within last 30 days)
  const activeUsersResult = await db
    .select({ userId: loginActivities.userId })
    .from(loginActivities)
    .where(
      and(
        eq(loginActivities.success, true),
        gte(loginActivities.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(loginActivities.userId);

  // Get new users (last 7 days)
  const [newUsersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, sevenDaysAgo));

  // Get suspended users
  const [suspendedUsersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.accountStatus, "suspended"));

  // Get users by status
  const usersByStatus = await db
    .select({
      status: users.accountStatus,
      count: count(),
    })
    .from(users)
    .groupBy(users.accountStatus);

  // Get users by email status
  const usersByEmailStatus = await db
    .select({
      status: users.emailStatus,
      count: count(),
    })
    .from(users)
    .groupBy(users.emailStatus);

  // Get recent login attempts
  const [totalLoginsResult] = await db
    .select({ count: count() })
    .from(loginActivities)
    .where(gte(loginActivities.createdAt, sevenDaysAgo));

  const [failedLoginsResult] = await db
    .select({ count: count() })
    .from(loginActivities)
    .where(
      and(
        eq(loginActivities.success, false),
        gte(loginActivities.createdAt, sevenDaysAgo)
      )
    );

  return {
    totalUsers: totalUsersResult.count,
    activeUsers: activeUsersResult.length,
    newUsers: newUsersResult.count,
    suspendedUsers: suspendedUsersResult.count,
    usersByStatus: usersByStatus.reduce(
      (acc, item) => {
        // Handle null status by converting to string
        const statusKey = item.status || "unknown";
        acc[statusKey] = item.count;
        return acc;
      },
      {} as Record<string, number>
    ),
    usersByEmailStatus: usersByEmailStatus.reduce(
      (acc, item) => {
        // Handle null status by converting to string
        const statusKey = item.status || "unknown";
        acc[statusKey] = item.count;
        return acc;
      },
      {} as Record<string, number>
    ),
    totalLogins: totalLoginsResult.count,
    failedLogins: failedLoginsResult.count,
    successRate:
      totalLoginsResult.count > 0
        ? ((totalLoginsResult.count - failedLoginsResult.count) /
            totalLoginsResult.count) *
          100
        : 0,
  };
}

export async function getUsersWithStats(input: GetUsersInput) {
  const { page = 1, limit = 50, search, status, emailStatus } = input;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${users.email} ILIKE ${`%${search}%`} OR ${users.name} ILIKE ${`%${search}%`})`
    );
  }
  if (status) {
    conditions.push(eq(users.accountStatus, status));
  }
  if (emailStatus) {
    conditions.push(eq(users.emailStatus, emailStatus));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get users with their last login
  const usersWithStats = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      accountStatus: users.accountStatus,
      emailStatus: users.emailStatus,
      emailVerified: users.emailVerified,
      isTwoFactorEnabled: users.isTwoFactorEnabled,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      image: users.image,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const [totalResult] = await db
    .select({ count: count() })
    .from(users)
    .where(whereClause);

  // Get last login for each user - fix the SQL query
  const userIds = usersWithStats.map((u) => u.id);
  let lastLogins: { userId: string; lastLogin: Date }[] = [];

  if (userIds.length > 0) {
    lastLogins = await db
      .select({
        userId: loginActivities.userId,
        lastLogin: sql<Date>`MAX(${loginActivities.createdAt})`.as("lastLogin"),
      })
      .from(loginActivities)
      .where(
        and(
          inArray(loginActivities.userId, userIds), // Use inArray instead of ANY
          eq(loginActivities.success, true)
        )
      )
      .groupBy(loginActivities.userId);
  }

  const lastLoginMap = new Map(
    lastLogins.map((item) => [item.userId, item.lastLogin])
  );

  // Map and ensure proper types by providing defaults for null values
  const usersWithLastLogin: UserWithStats[] = usersWithStats.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    accountStatus: user.accountStatus || "active", // Default to active if null
    emailStatus: user.emailStatus || "pending", // Default to pending if null
    emailVerified: user.emailVerified,
    isTwoFactorEnabled: user.isTwoFactorEnabled ?? false, // Default to false if null
    failedLoginAttempts: user.failedLoginAttempts || 0, // Default to 0 if null
    lockedUntil: user.lockedUntil,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    image: user.image,
    lastLogin: lastLoginMap.get(user.id) || null,
  }));

  return {
    users: usersWithLastLogin,
    totalCount: totalResult.count,
    totalPages: Math.ceil(totalResult.count / limit),
    currentPage: page,
    hasMore: page * limit < totalResult.count,
  };
}

export async function getUserActivityLog(input: GetActivityLogInput) {
  const { page = 1, limit = 100, userId, ipAddress, success } = input;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (userId) {
    conditions.push(eq(loginActivities.userId, userId));
  }
  if (ipAddress) {
    conditions.push(like(loginActivities.ipAddress, `%${ipAddress}%`));
  }
  if (success !== undefined) {
    conditions.push(eq(loginActivities.success, success));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const activities = await db
    .select({
      id: loginActivities.id,
      userId: loginActivities.userId,
      userEmail: users.email,
      userName: users.name,
      ipAddress: loginActivities.ipAddress,
      userAgent: loginActivities.userAgent,
      success: loginActivities.success,
      createdAt: loginActivities.createdAt,
    })
    .from(loginActivities)
    .leftJoin(users, eq(loginActivities.userId, users.id))
    .where(whereClause)
    .orderBy(desc(loginActivities.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(loginActivities)
    .where(whereClause);

  return {
    activities,
    totalCount: totalResult.count,
    totalPages: Math.ceil(totalResult.count / limit),
    currentPage: page,
    hasMore: page * limit < totalResult.count,
  };
}

export async function suspendUser(userId: string, reason?: string) {
  await db
    .update(users)
    .set({
      accountStatus: "suspended",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return {
    success: true,
    message: `User suspended successfully. Reason: ${reason}`,
  };
}

export async function updateUserStatus(
  userId: string,
  status: "active" | "suspended" | "deleted"
) {
  await db
    .update(users)
    .set({
      accountStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true, message: `User status updated to ${status}` };
}
