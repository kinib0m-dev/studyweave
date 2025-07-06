import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Retrieves a user record by their email address.
 *
 * @param {string} email - The email address of the user to retrieve
 * @returns {Promise<Object|null>} A promise that resolves to the user record
 * if found, or null if not found or if an error occurs
 */
export async function getUserByEmail(email: string) {
  try {
    const data = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}

/**
 * Retrieves a user record by their unique identifier.
 *
 * @param {string} userId - The ID of the user to retrieve
 * @returns {Promise<Object|null>} A promise that resolves to the user record
 * if found, or null if not found or if an error occurs
 */
export async function getUserById(userId: string) {
  try {
    const data = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}

/**
 * Updates a user's account status
 */
export async function updateAccountStatus(
  userId: string,
  status: "active" | "suspended" | "deleted"
) {
  try {
    await db
      .update(users)
      .set({
        accountStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Error updating account status:", error);
    return { success: false, error: "Failed to update account status" };
  }
}

/**
 * Updates a user's email verification status
 */
export async function updateEmailStatus(
  userId: string,
  status: "pending" | "confirmed" | "expired"
) {
  try {
    await db
      .update(users)
      .set({
        emailStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Error updating email status:", error);
    return { success: false, error: "Failed to update email status" };
  }
}

/**
 * Gets users by account status
 */
export async function getUsersByAccountStatus(
  status: "active" | "suspended" | "deleted"
) {
  try {
    const data = await db
      .select()
      .from(users)
      .where(eq(users.accountStatus, status));

    return data;
  } catch (error) {
    console.error("Error fetching users by account status:", error);
    return [];
  }
}

/**
 * Gets users by email status
 */
export async function getUsersByEmailStatus(
  status: "pending" | "confirmed" | "expired"
) {
  try {
    const data = await db
      .select()
      .from(users)
      .where(eq(users.emailStatus, status));

    return data;
  } catch (error) {
    console.error("Error fetching users by email status:", error);
    return [];
  }
}
