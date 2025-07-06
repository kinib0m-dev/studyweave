import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import {
  passwordResetTokens,
  twoFactorTokens,
  verificationTokens,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { getVerificationTokenByEmail } from "./verificationToken";
import { getPasswordResetTokenByEmail } from "./passwordReset";
import { getTwoFactorTokenByEmail } from "./twoFactor";

/**
 * Generates a verification token for email verification processes.
 *
 * @param {string} email - The email address to associate with the verification token
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 *   - email: The email address associated with the token
 *   - token: The generated verification token (UUID)
 *   - expires: The expiration date (1 hour from creation)
 */
export async function generateVerificationToken(email: string) {
  try {
    // Generate the token
    const token = uuidv4();

    // Expire the token in an hour
    const expires = new Date(new Date().getTime() + 3600 * 1000);

    const existingToken = await getVerificationTokenByEmail(email);

    if (existingToken) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.id, existingToken.id));
    }

    // Insert and explicitly return the inserted values
    await db.insert(verificationTokens).values({
      email,
      token,
      expires,
    });

    // Retrieve the inserted token
    return { email, token, expires };
  } catch (error) {
    console.error("Error generating verification token:", error);
    throw new Error("Failed to generate verification token");
  }
}

/**
 * Generates a password reset token to facilitate password reset processes.
 *
 * @param {string} email - The email address to associate with the password reset token
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 *   - email: The email address associated with the token
 *   - token: The generated password reset token (UUID)
 *   - expires: The expiration date (1 hour from creation)
 */
export async function generateResetPasswordToken(email: string) {
  try {
    // Generate the token
    const token = uuidv4();

    // Expire the token in an hour
    const expires = new Date(new Date().getTime() + 3600 * 1000);

    const existingToken = await getPasswordResetTokenByEmail(email);

    if (existingToken) {
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, existingToken.id));
    }

    // FIXED: Added await here
    await db.insert(passwordResetTokens).values({
      email,
      token,
      expires,
    });

    return { email, token, expires };
  } catch (error) {
    console.error("Error generating password reset token:", error);
    throw new Error("Failed to generate password reset token");
  }
}

/**
 * Generates a two-factor authentication token.
 *
 * @param {string} email - The email address to associate with the two-factor token
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 *   - email: The email address associated with the token
 *   - token: The generated two-factor token (6-digit number)
 *   - expires: The expiration date (5 minutes from creation)
 */
export async function generateTwoFactorToken(email: string) {
  try {
    // Generate a 6 digit code
    const token = crypto.randomInt(100_000, 1_000_000).toString();
    // Expire the token in 5 minutes
    const expires = new Date(new Date().getTime() + 5 * 60 * 1000);

    const existingToken = await getTwoFactorTokenByEmail(email);

    if (existingToken) {
      await db
        .delete(twoFactorTokens)
        .where(eq(twoFactorTokens.id, existingToken.id));
    }

    await db.insert(twoFactorTokens).values({
      email,
      token,
      expires,
    });

    return { email, token, expires };
  } catch (error) {
    console.error("Error generating two-factor token:", error);
    throw new Error("Failed to generate two-factor token");
  }
}

/**
 * Validates token expiration
 */
export function isTokenExpired(expires: Date): boolean {
  return new Date(expires) < new Date();
}

/**
 * Generates a secure random token with specified length
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Token cleanup utility - removes expired tokens
 */
export async function cleanupExpiredTokens() {
  try {
    const now = new Date();

    // Clean up verification tokens
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.expires, now));

    // Clean up password reset tokens
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.expires, now));

    // Clean up two-factor tokens
    await db.delete(twoFactorTokens).where(eq(twoFactorTokens.expires, now));

    console.log("Expired tokens cleaned up successfully");
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
  }
}

/**
 * Token validation utility
 */
export async function validateTokenFormat(
  token: string,
  type: "uuid" | "numeric"
): Promise<boolean> {
  if (type === "uuid") {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(token);
  } else if (type === "numeric") {
    const numericRegex = /^\d{6}$/;
    return numericRegex.test(token);
  }
  return false;
}
