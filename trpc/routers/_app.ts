import { authRouter } from "@/lib/auth/server/procedures";
import { createTRPCRouter } from "../init";
import { adminRouter } from "@/lib/admin/server/procedures";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // Admin
  admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
