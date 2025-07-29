import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  leetcodeUsername: text("leetcode_username").notNull().unique(),
  leetcodeProfileLink: text("leetcode_profile_link").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyProgress = pgTable("daily_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalSolved: integer("total_solved").notNull().default(0),
  easySolved: integer("easy_solved").notNull().default(0),
  mediumSolved: integer("medium_solved").notNull().default(0),
  hardSolved: integer("hard_solved").notNull().default(0),
  dailyIncrement: integer("daily_increment").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weeklyTrends = pgTable("weekly_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  weekStart: text("week_start").notNull(), // YYYY-MM-DD format
  weekEnd: text("week_end").notNull(),
  totalProblems: integer("total_problems").notNull().default(0),
  weeklyIncrement: integer("weekly_increment").notNull().default(0),
  ranking: integer("ranking").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  badgeType: text("badge_type").notNull(), // streak_master, century_coder, comeback_coder, weekly_topper
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lastSyncTime: timestamp("last_sync_time"),
  isAutoSyncEnabled: boolean("is_auto_sync_enabled").default(true),
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklyTrendSchema = createInsertSchema(weeklyTrends).omit({
  id: true,
  createdAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  earnedAt: true,
});

// Types
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;

export type WeeklyTrend = typeof weeklyTrends.$inferSelect;
export type InsertWeeklyTrend = z.infer<typeof insertWeeklyTrendSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type AppSettings = typeof appSettings.$inferSelect;

// API Response types
export interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  ranking: number;
}

export interface StudentDashboardData {
  student: Student;
  stats: LeetCodeStats;
  currentStreak: number;
  weeklyRank: number;
  badges: Badge[];
  weeklyProgress: number[];
  dailyActivity: { date: string; count: number }[];
}

export interface AdminDashboardData {
  totalStudents: number;
  activeStudents: number;
  avgProblems: number;
  underperforming: number;
  students: (Student & {
    stats: LeetCodeStats;
    weeklyProgress: number;
    streak: number;
    status: string;
  })[];
  leaderboard: {
    rank: number;
    student: Student;
    weeklyScore: number;
  }[];
}
