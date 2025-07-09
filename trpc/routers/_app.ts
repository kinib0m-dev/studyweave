import { authRouter } from "@/lib/auth/server/procedures";
import { createTRPCRouter } from "../init";
import { adminRouter } from "@/lib/admin/server/procedures";
import { subjectRouter } from "@/lib/subject/server/procedures";
import { docsRouter } from "@/lib/docs/server/procedures";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // Admin
  admin: adminRouter,
  // Subjects
  subject: subjectRouter,
  // Doocuments
  docs: docsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
