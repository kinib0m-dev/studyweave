import { TRPCError } from "@trpc/server";
import { Context } from "@/trpc/init";

/**
 * Extended context type that includes subject information
 */
export interface SubjectContext extends Context {
  userId: string; // Make required since we validate it exists
  subjectId: string;
}

/**
 * Creates an subject-scoped context for tRPC procedures
 * This function should be used in procedures that require subject context
 */
export function createSubjectContext(
  ctx: Context,
  subjectId: string
): Promise<SubjectContext> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      resolve({
        ...ctx,
        userId: ctx.userId, // Explicitly ensure userId is string
        subjectId,
      } as SubjectContext);
    } catch (error) {
      reject(error);
    }
  });
}
