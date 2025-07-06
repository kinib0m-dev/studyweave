import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSubjectContext } from "@/lib/subject/middleware/subject-middleware";
import { ratelimit } from "@/lib/utils/ratelimit";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import superjson from "superjson";
import z from "zod";

export const createTRPCContext = cache(async () => {
  const session = await auth();
  return { userId: session?.user.id };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const baseProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  async function isAuthed(opts) {
    const { ctx } = opts;

    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    // We are going to do the ratelimiter by user and not by IP, if you want to know by IP check the pnpm_auth_template
    const { success } = await ratelimit.limit(user.id);

    if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

    return opts.next({
      ctx: {
        ...ctx,
        user,
      },
    });
  }
);

export const adminProcedure = t.procedure.use(async function isAdmin(opts) {
  const { ctx } = opts;
  const ADMIN_EMAIL = "kinib0m.dev@gmail.com";

  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);

  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

  // Check if user is admin
  if (user.email !== ADMIN_EMAIL) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Admin privileges required.",
    });
  }

  // Rate limiting for admin actions
  const { success } = await ratelimit.limit(`admin:${user.id}`);
  if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

  return opts.next({
    ctx: {
      ...ctx,
      user,
      isAdmin: true,
    },
  });
});

/**
 * Subject-scoped procedure that validates user has access to the subject
 * Requires subjectId in input and adds subject context
 */
export const subjectProcedure = protectedProcedure
  .input(
    z.object({
      subjectId: z.string().uuid("Invalid subject ID"),
    })
  )
  .use(async function validateSubject(opts) {
    const { ctx, input } = opts;

    if (!ctx.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Validate organization access and create enhanced context
    const subjectContext = await createSubjectContext(ctx, input.subjectId);

    return opts.next({
      ctx: subjectContext,
    });
  });
