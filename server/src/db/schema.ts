import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
};

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  avatarPath: text("avatar_path"),
  ...timestamps,
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  ...timestamps,
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({ userIdx: index("session_user_id_idx").on(table.userId) }));

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
}, (table) => ({ userIdx: index("account_user_id_idx").on(table.userId) }));

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ...timestamps,
}, (table) => ({ identifierIdx: index("verification_identifier_idx").on(table.identifier) }));

export const journals = sqliteTable("journals", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title"), content: text("content").notNull(), mood: text("mood"), prompt: text("prompt"),
  tags: text("tags", { mode: "json" }).$type<string[]>(), isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({ userIdx: index("journals_user_id_idx").on(table.userId) }));

export const moods = sqliteTable("moods", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  mood: text("mood").notNull(), note: text("note"), createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({ userIdx: index("moods_user_id_idx").on(table.userId) }));

export const quizHistory = sqliteTable("quiz_history", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  quizType: text("quiz_type").notNull(), score: integer("score").notNull(), category: text("category").notNull(),
  takenAt: integer("taken_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({ userIdx: index("quiz_history_user_id_idx").on(table.userId) }));

export const consultations = sqliteTable("consultations", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  psychologistId: text("psychologist_id").notNull().references(() => psychologists.id), status: text("status").notNull(),
  scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }).notNull(), notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({ userIdx: index("consultations_user_id_idx").on(table.userId) }));

export const psychologists = sqliteTable("psychologists", {
  id: text("id").primaryKey(), name: text("name").notNull(), specialization: text("specialization"), bio: text("bio"), photoUrl: text("photo_url"), rating: integer("rating"),
});

export const schema = { user, session, account, verification, journals, moods, quizHistory, consultations, psychologists };
