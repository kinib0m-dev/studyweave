import { db } from "@/db";
import {
  passwordResetTokens,
  twoFactorTokens,
  users,
  verificationTokens,
} from "@/db/schema";
import { eq, lt } from "drizzle-orm";

/**
 * Cleanup expired verification tokens and mark email statuses as expired
 */
export async function cleanupExpiredVerificationTokens() {
  try {
    const now = new Date();

    // Find all expired verification tokens
    const expiredTokens = await db
      .select()
      .from(verificationTokens)
      .where(lt(verificationTokens.expires, now));

    console.log(`Found ${expiredTokens.length} expired verification tokens`);

    // Update email status to expired for users with expired tokens
    for (const token of expiredTokens) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, token.email))
        .limit(1);

      if (user.length > 0 && user[0].emailStatus === "pending") {
        await db
          .update(users)
          .set({ emailStatus: "expired" })
          .where(eq(users.id, user[0].id));

        console.log(
          `Marked email status as expired for user: ${user[0].email}`
        );
      }
    }

    // Delete expired verification tokens
    await db
      .delete(verificationTokens)
      .where(lt(verificationTokens.expires, now));

    console.log(
      `Cleaned up ${expiredTokens.length} expired verification tokens`
    );
    return {
      success: true,
      verificationTokensDeleted: expiredTokens.length,
    };
  } catch (error) {
    console.error("Error cleaning up expired verification tokens:", error);
    return { success: false, error };
  }
}

/**
 * Cleanup all types of expired tokens
 */
export async function cleanupAllExpiredTokens() {
  try {
    const now = new Date();
    let totalDeleted = 0;

    // Clean up verification tokens and update user email status
    const verificationResult = await cleanupExpiredVerificationTokens();
    if (verificationResult.success) {
      totalDeleted += verificationResult.verificationTokensDeleted || 0;
    }

    // Clean up password reset tokens
    const expiredPasswordResetTokens = await db
      .select()
      .from(passwordResetTokens)
      .where(lt(passwordResetTokens.expires, now));

    if (expiredPasswordResetTokens.length > 0) {
      await db
        .delete(passwordResetTokens)
        .where(lt(passwordResetTokens.expires, now));

      totalDeleted += expiredPasswordResetTokens.length;
      console.log(
        `Cleaned up ${expiredPasswordResetTokens.length} expired password reset tokens`
      );
    }

    // Clean up two-factor tokens
    const expiredTwoFactorTokens = await db
      .select()
      .from(twoFactorTokens)
      .where(lt(twoFactorTokens.expires, now));

    if (expiredTwoFactorTokens.length > 0) {
      await db.delete(twoFactorTokens).where(lt(twoFactorTokens.expires, now));

      totalDeleted += expiredTwoFactorTokens.length;
      console.log(
        `Cleaned up ${expiredTwoFactorTokens.length} expired two-factor tokens`
      );
    }

    console.log(`Total expired tokens cleaned up: ${totalDeleted}`);
    return {
      success: true,
      totalDeleted,
      verificationTokens: verificationResult.verificationTokensDeleted || 0,
      passwordResetTokens: expiredPasswordResetTokens.length,
      twoFactorTokens: expiredTwoFactorTokens.length,
    };
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
    return { success: false, error };
  }
}
