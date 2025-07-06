import { db } from "@/db";
import { subjects } from "@/db/schema";
import { eq, ne, and } from "drizzle-orm";
import { generateSlug } from "./subject-utils";

/**
 * Validates if a slug is available for an subject
 */
export async function isSlugAvailable(
  slug: string,
  excludeSubjectId?: string
): Promise<boolean> {
  try {
    const existingSubject = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(
        excludeSubjectId
          ? and(eq(subjects.slug, slug), ne(subjects.id, excludeSubjectId))
          : eq(subjects.slug, slug)
      )
      .limit(1);

    return existingSubject.length === 0;
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return false;
  }
}

/**
 * Generates a unique slug for an subject
 */
export async function generateUniqueSlug(
  name: string,
  excludeSubjectId?: string
): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find an available slug
  while (!(await isSlugAvailable(slug, excludeSubjectId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Prevent infinite loops
    if (counter > 1000) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}
