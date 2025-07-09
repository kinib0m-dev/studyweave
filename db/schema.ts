import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  boolean,
  index,
  pgEnum,
  customType,
  json,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailStatus: text("email_status", {
      enum: ["pending", "confirmed", "expired"],
    }).default("pending"),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    accountStatus: text("account_status", {
      enum: ["active", "suspended", "deleted"],
    }).default("active"),
    image: text("image"),
    password: text("password"),
    isTwoFactorEnabled: boolean("is_two_factor_enabled").default(false),
    failedLoginAttempts: integer("failed_login_attempts").default(0),
    lastFailedLoginAttempt: timestamp("last_failed_login_attempt", {
      mode: "date",
    }),
    lockedUntil: timestamp("locked_until", { mode: "date" }),
    securityVersion: integer("security_version").default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for better query performance
    emailIdx: index("users_email_idx").on(table.email),
    accountStatusIdx: index("users_account_status_idx").on(table.accountStatus),
    emailStatusIdx: index("users_email_status_idx").on(table.emailStatus),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
    lockedUntilIdx: index("users_locked_until_idx").on(table.lockedUntil),
  })
);

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
    // Index for faster user lookups
    index("accounts_user_id_idx").on(account.userId),
  ]
);

export const loginActivities = pgTable(
  "login_activities",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent"),
    success: boolean("success").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Indexes for login activity queries
    userIdIdx: index("login_activities_user_id_idx").on(table.userId),
    createdAtIdx: index("login_activities_created_at_idx").on(table.createdAt),
    successIdx: index("login_activities_success_idx").on(table.success),
    ipAddressIdx: index("login_activities_ip_address_idx").on(table.ipAddress),
  })
);

// Add indexes to existing tables...
export const verificationTokens = pgTable(
  "verification_token",
  {
    id: uuid("id").notNull().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.id, verificationToken.token],
      }),
    },
    // Indexes for token lookups
    index("verification_tokens_email_idx").on(verificationToken.email),
    index("verification_tokens_expires_idx").on(verificationToken.expires),
  ]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").notNull().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (passwordResetToken) => [
    {
      compositePk: primaryKey({
        columns: [passwordResetToken.id, passwordResetToken.token],
      }),
    },
    // Indexes for token lookups
    index("password_reset_tokens_email_idx").on(passwordResetToken.email),
    index("password_reset_tokens_expires_idx").on(passwordResetToken.expires),
  ]
);

export const twoFactorTokens = pgTable(
  "two_factor_tokens",
  {
    id: uuid("id").notNull().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (twoFactorToken) => [
    {
      compositePk: primaryKey({
        columns: [twoFactorToken.id, twoFactorToken.token],
      }),
    },
    // Indexes for token lookups
    index("two_factor_tokens_email_idx").on(twoFactorToken.email),
    index("two_factor_tokens_expires_idx").on(twoFactorToken.expires),
  ]
);

export const twoFactorConfirmation = pgTable(
  "two_factor_confirmations",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    // Index for user lookups
    userIdIdx: index("two_factor_confirmations_user_id_idx").on(table.userId),
  })
);

// ------------------------------------ SUBJECTS ------------------------------------
// Predefined subject colors
export const subjectColorEnum = pgEnum("subject_color", [
  "blue",
  "green",
  "purple",
  "red",
  "orange",
  "yellow",
  "pink",
  "teal",
  "indigo",
  "gray",
]);

// subjects table
export const subjects = pgTable("subjects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // For clean URLs
  description: text("description"), // Optional description
  color: subjectColorEnum("color").notNull().default("blue"), // Predefined colors

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ------------------------------------ VECTOR TYPE ------------------------------------
const vector = (dimensions: number) =>
  customType<{
    data: number[];
    driverData: string;
  }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value) {
      // Format as Postgres array string for pgvector: e.g. '[0.1, 0.2, ...]'
      return `[${value.join(",")}]`;
    },
    fromDriver(value) {
      // Convert PG string back to array
      return value.slice(1, -1).split(",").map(Number);
    },
  });

// ------------------------------------ DOCUMENTS ------------------------------------
// Documents table for storing text content for embedding
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").references(() => subjects.id, {
      onDelete: "set null",
    }),

    // Content
    title: text("title").notNull(),
    content: text("content").notNull(),
    fileName: text("file_name"),

    // File metadata
    fileSize: integer("file_size"),
    fileType: text("file_type"),
    wordCount: integer("word_count"),
    pageCount: integer("page_count"),
    metadata: json("metadata"),

    // Vector
    embedding: vector(768)("embedding"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Indexes
    userIdIdx: index("documents_user_id_idx").on(table.userId),
    subjectIdIdx: index("documents_subject_id_idx").on(table.subjectId),
    fileTypeIdx: index("documents_file_type_idx").on(table.fileType),
    createdAtIdx: index("documents_created_at_idx").on(table.createdAt),
  })
);
