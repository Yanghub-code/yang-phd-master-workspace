import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const workspaceUsers = sqliteTable("workspace_users", {
  id: text("id").primaryKey(),
  // This is a personal workspace: one durable owner slot prevents a race from
  // accidentally creating two accounts during first-time setup.
  ownerSlot: integer("owner_slot").notNull().default(1).unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: text("created_at").notNull(),
  passwordUpdatedAt: text("password_updated_at").notNull(),
});

export const workspaceSessions = sqliteTable("workspace_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const workspaceData = sqliteTable("workspace_data", {
  userId: text("user_id").primaryKey(),
  payloadJson: text("payload_json").notNull(),
  revision: integer("revision").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const loginThrottle = sqliteTable("login_throttle", {
  scope: text("scope").primaryKey(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: text("locked_until"),
  updatedAt: text("updated_at").notNull(),
});
