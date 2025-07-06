import { authRouter } from "@/lib/auth/server/procedures";
import { createTRPCRouter } from "../init";
import { adminRouter } from "@/lib/admin/server/procedures";
import { subjectRouter } from "@/lib/subject/server/procedures";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // Admin
  admin: adminRouter,
  // Subjects
  subject: subjectRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
