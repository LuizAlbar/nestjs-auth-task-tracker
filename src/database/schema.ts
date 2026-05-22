import {
	boolean,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const userRoleAuth = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	name: text("name").notNull(),
	role: userRoleAuth("role").notNull().default("user"),
	isVerified: boolean("is_verified").notNull().default(false),
	verificationToken: text("verification_token"),
	verificationTokenExpiresAt: timestamp("verification_token_expires_at"),
	resetToken: text("reset_token"),
	resetTokenExpiresAt: timestamp("reset_token_expires_at"),
	refreshTokenHash: text("refresh_token_hash"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const taskStatusEnum = pgEnum("task_status", [
	"todo",
	"in_progress",
	"done",
]);

export const tasks = pgTable("tasks", {
	id: uuid("id").defaultRandom().primaryKey(),
	title: text("title").notNull(),
	description: text("description"),
	status: taskStatusEnum("status").notNull().default("todo"),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
