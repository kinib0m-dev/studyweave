import {
  createTRPCRouter,
  protectedProcedure,
  subjectProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {
  createSubjectSchema,
  updateSubjectSchema,
} from "../validation/subject-schema";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { generateUniqueSlug } from "../utils/server-subject-utils";
import { eq, desc } from "drizzle-orm";

export const subjectRouter = createTRPCRouter({
  // Create a new subject
  create: protectedProcedure
    .input(createSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const slug = await generateUniqueSlug(input.name);

        // Add fallback for color to ensure it's never undefined
        const color = input.color || "blue";

        const [newSubject] = await db
          .insert(subjects)
          .values({
            userId,
            name: input.name,
            description: input.description,
            slug: slug,
            color: color, // Use the fallback
          })
          .returning();

        return {
          success: true,
          subject: newSubject,
        };
      } catch (error) {
        console.error("Error creating subject:", error);

        // Log more details about the error
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create subject",
        });
      }
    }),

  // Get all subjects for current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.userId as string;

      const userSubjects = await db
        .select({
          id: subjects.id,
          name: subjects.name,
          slug: subjects.slug,
          description: subjects.description,
          color: subjects.color,
          createdAt: subjects.createdAt,
        })
        .from(subjects)
        .where(eq(subjects.userId, userId))
        .orderBy(desc(subjects.createdAt));

      return {
        success: true,
        subjects: userSubjects,
      };
    } catch (error) {
      console.error("Error fetching subjects:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subjects",
      });
    }
  }),

  // Get subject by ID with subject context
  getById: subjectProcedure.query(async ({ ctx }) => {
    try {
      const { subjectId } = ctx;

      const [subject] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, subjectId))
        .limit(1);

      if (!subject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subject not found",
        });
      }

      return {
        success: true,
        subject: subject,
      };
    } catch (error) {
      console.error("Error fetching subject:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subject",
      });
    }
  }),

  // Update subject
  update: subjectProcedure
    .input(updateSubjectSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { subjectId } = ctx;

        // Get current subject for slug generation
        const currentSubject = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, subjectId))
          .limit(1);

        if (currentSubject.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subject not found",
          });
        }

        // Generate new slug if name changed
        let slug = currentSubject[0].slug;
        if (currentSubject[0].name !== input.name) {
          slug = await generateUniqueSlug(input.name, subjectId);
        }

        const [updatedSubject] = await db
          .update(subjects)
          .set({
            name: input.name,
            description: input.description,
            color: input.color,
            slug: slug,
            updatedAt: new Date(),
          })
          .where(eq(subjects.id, subjectId))
          .returning();

        return {
          success: true,
          subject: updatedSubject,
        };
      } catch (error) {
        console.error("Error updating subject:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update subject",
        });
      }
    }),

  // Delete subject
  delete: subjectProcedure.mutation(async ({ ctx }) => {
    try {
      const { subjectId } = ctx;

      // Delete subject
      await db.delete(subjects).where(eq(subjects.id, subjectId));

      return {
        success: true,
        message: "Subject deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting subject:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete subject",
      });
    }
  }),
});
