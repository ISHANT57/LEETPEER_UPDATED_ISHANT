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

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // "admin" or "student"
  studentId: varchar("student_id").references(() => students.id), // nullable for admin users
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Topic tags for problem categorization
export const topicTags = pgTable("topic_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // "Array", "Dynamic Programming", etc.
  description: text("description"),
  color: text("color").default("#3B82F6"), // hex color for UI
  createdAt: timestamp("created_at").defaultNow(),
});

// Student mastery of topic tags
export const studentTopicMastery = pgTable("student_topic_mastery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  topicTagId: varchar("topic_tag_id").references(() => topicTags.id).notNull(),
  problemsSolved: integer("problems_solved").notNull().default(0),
  totalProblems: integer("total_problems").notNull().default(0),
  masteryPercentage: integer("mastery_percentage").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Student submissions for verification
export const studentSubmissions = pgTable("student_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  problemTitle: text("problem_title").notNull(),
  problemUrl: text("problem_url").notNull(),
  difficulty: text("difficulty").notNull(), // "Easy", "Medium", "Hard"
  topicTags: jsonb("topic_tags").default([]), // Array of topic tag names
  screenshotUrl: text("screenshot_url"), // Optional screenshot for verification
  status: text("status").default("pending"), // "pending", "verified", "rejected"
  submittedAt: timestamp("submitted_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => users.id),
});

// Public dashboard settings
export const publicDashboards = pgTable("public_dashboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  publicUrl: text("public_url").notNull().unique(),
  isEnabled: boolean("is_enabled").default(false),
  viewCount: integer("view_count").default(0),
  lastViewedAt: timestamp("last_viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const insertTopicTagSchema = createInsertSchema(topicTags).omit({
  id: true,
  createdAt: true,
});

export const insertStudentTopicMasterySchema = createInsertSchema(studentTopicMastery).omit({
  id: true,
  lastUpdated: true,
});

export const insertStudentSubmissionSchema = createInsertSchema(studentSubmissions).omit({
  id: true,
  submittedAt: true,
  verifiedAt: true,
});

export const insertPublicDashboardSchema = createInsertSchema(publicDashboards).omit({
  id: true,
  createdAt: true,
  lastViewedAt: true,
});

// Login schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
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

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TopicTag = typeof topicTags.$inferSelect;
export type InsertTopicTag = z.infer<typeof insertTopicTagSchema>;

export type StudentTopicMastery = typeof studentTopicMastery.$inferSelect;
export type InsertStudentTopicMastery = z.infer<typeof insertStudentTopicMasterySchema>;

export type StudentSubmission = typeof studentSubmissions.$inferSelect;
export type InsertStudentSubmission = z.infer<typeof insertStudentSubmissionSchema>;

export type PublicDashboard = typeof publicDashboards.$inferSelect;
export type InsertPublicDashboard = z.infer<typeof insertPublicDashboardSchema>;

export type LoginRequest = z.infer<typeof loginSchema>;

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
