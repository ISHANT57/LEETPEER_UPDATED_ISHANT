import { 
  type Student, 
  type InsertStudent,
  type DailyProgress,
  type InsertDailyProgress,
  type WeeklyTrend,
  type InsertWeeklyTrend,
  type Badge,
  type InsertBadge,
  type AppSettings,
  type LeetCodeStats,
  type StudentDashboardData,
  type AdminDashboardData,
  students,
  dailyProgress,
  weeklyTrends,
  badges,
  appSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Students
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByUsername(username: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined>;

  // Daily Progress
  getDailyProgress(studentId: string, date: string): Promise<DailyProgress | undefined>;
  getStudentDailyProgress(studentId: string, days?: number): Promise<DailyProgress[]>;
  createDailyProgress(progress: InsertDailyProgress): Promise<DailyProgress>;
  updateDailyProgress(studentId: string, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress | undefined>;

  // Weekly Trends
  getWeeklyTrends(studentId: string, weeks?: number): Promise<WeeklyTrend[]>;
  createWeeklyTrend(trend: InsertWeeklyTrend): Promise<WeeklyTrend>;
  getCurrentWeekTrend(studentId: string): Promise<WeeklyTrend | undefined>;

  // Badges
  getStudentBadges(studentId: string): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  hasStudentEarnedBadge(studentId: string, badgeType: string): Promise<boolean>;

  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings>;

  // Dashboard Data
  getStudentDashboardData(username: string): Promise<StudentDashboardData | undefined>;
  getAdminDashboardData(): Promise<AdminDashboardData>;
  getLeaderboard(limit?: number): Promise<AdminDashboardData['leaderboard']>;

  // Utility methods
  calculateStreak(studentId: string): Promise<number>;
  getStudentStats(studentId: string): Promise<LeetCodeStats | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database will be initialized via migrations
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByUsername(username: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.leetcodeUsername, username));
    return student || undefined;
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db
      .insert(students)
      .values(insertStudent)
      .returning();
    return student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const [student] = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, id))
      .returning();
    return student || undefined;
  }

  async getDailyProgress(studentId: string, date: string): Promise<DailyProgress | undefined> {
    const [progress] = await db
      .select()
      .from(dailyProgress)
      .where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date)));
    return progress || undefined;
  }

  async getStudentDailyProgress(studentId: string, days = 30): Promise<DailyProgress[]> {
    return await db
      .select()
      .from(dailyProgress)
      .where(eq(dailyProgress.studentId, studentId))
      .orderBy(desc(dailyProgress.date))
      .limit(days);
  }

  async createDailyProgress(insertProgress: InsertDailyProgress): Promise<DailyProgress> {
    const [progress] = await db
      .insert(dailyProgress)
      .values(insertProgress)
      .returning();
    return progress;
  }

  async updateDailyProgress(studentId: string, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress | undefined> {
    const [progress] = await db
      .update(dailyProgress)
      .set(updates)
      .where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date)))
      .returning();
    return progress || undefined;
  }

  async getWeeklyTrends(studentId: string, weeks = 12): Promise<WeeklyTrend[]> {
    return await db
      .select()
      .from(weeklyTrends)
      .where(eq(weeklyTrends.studentId, studentId))
      .orderBy(desc(weeklyTrends.weekStart))
      .limit(weeks);
  }

  async createWeeklyTrend(insertTrend: InsertWeeklyTrend): Promise<WeeklyTrend> {
    const [trend] = await db
      .insert(weeklyTrends)
      .values(insertTrend)
      .returning();
    return trend;
  }

  async getCurrentWeekTrend(studentId: string): Promise<WeeklyTrend | undefined> {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const [trend] = await db
      .select()
      .from(weeklyTrends)
      .where(and(eq(weeklyTrends.studentId, studentId), eq(weeklyTrends.weekStart, weekStartStr)));
    return trend || undefined;
  }

  async getStudentBadges(studentId: string): Promise<Badge[]> {
    return await db
      .select()
      .from(badges)
      .where(eq(badges.studentId, studentId))
      .orderBy(desc(badges.earnedAt));
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const [badge] = await db
      .insert(badges)
      .values(insertBadge)
      .returning();
    return badge;
  }

  async hasStudentEarnedBadge(studentId: string, badgeType: string): Promise<boolean> {
    const [badge] = await db
      .select()
      .from(badges)
      .where(and(eq(badges.studentId, studentId), eq(badges.badgeType, badgeType)))
      .limit(1);
    return !!badge;
  }

  async getAppSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db
      .select()
      .from(appSettings)
      .limit(1);
    
    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db
        .insert(appSettings)
        .values({
          lastSyncTime: null,
          isAutoSyncEnabled: true,
        })
        .returning();
      return newSettings;
    }
    
    return settings;
  }

  async updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    // Get current settings or create if none exist
    const current = await this.getAppSettings();
    
    const [settings] = await db
      .update(appSettings)
      .set(updates)
      .where(eq(appSettings.id, current!.id))
      .returning();
    
    return settings;
  }

  async calculateStreak(studentId: string): Promise<number> {
    const progressList = await this.getStudentDailyProgress(studentId, 100);
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < progressList.length; i++) {
      const progress = progressList[i];
      const progressDate = new Date(progress.date);
      const daysDiff = Math.floor((today.getTime() - progressDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i && progress.dailyIncrement >= 5) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  async getStudentStats(studentId: string): Promise<LeetCodeStats | undefined> {
    const latestProgress = await this.getStudentDailyProgress(studentId, 1);
    if (latestProgress.length === 0) return undefined;
    
    const progress = latestProgress[0];
    return {
      totalSolved: progress.totalSolved,
      easySolved: progress.easySolved,
      mediumSolved: progress.mediumSolved,
      hardSolved: progress.hardSolved,
      acceptanceRate: 0, // Would be calculated from more detailed data
      ranking: 0, // Would be calculated from leaderboard
    };
  }

  async getStudentDashboardData(username: string): Promise<StudentDashboardData | undefined> {
    const student = await this.getStudentByUsername(username);
    if (!student) return undefined;
    
    const stats = await this.getStudentStats(student.id);
    if (!stats) {
      // Return default stats if no progress data
      const defaultStats = {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        acceptanceRate: 0,
        ranking: 0,
      };
      
      return {
        student,
        stats: defaultStats,
        currentStreak: 0,
        weeklyRank: 0,
        badges: [],
        weeklyProgress: [],
        dailyActivity: [],
      };
    }
    
    const currentStreak = await this.calculateStreak(student.id);
    const badgesList = await this.getStudentBadges(student.id);
    const weeklyTrendsList = await this.getWeeklyTrends(student.id, 7);
    const dailyProgressList = await this.getStudentDailyProgress(student.id, 30);
    
    const weeklyProgress = weeklyTrendsList.map(trend => trend.weeklyIncrement);
    const dailyActivity = dailyProgressList.map(progress => ({
      date: progress.date,
      count: progress.dailyIncrement,
    }));
    
    // Calculate weekly rank (simplified)
    let weeklyRank = 0;
    if (weeklyTrendsList.length > 0) {
      const currentWeekStart = weeklyTrendsList[0].weekStart;
      const allWeeklyTrendsQuery = await db
        .select()
        .from(weeklyTrends)
        .where(eq(weeklyTrends.weekStart, currentWeekStart))
        .orderBy(desc(weeklyTrends.weeklyIncrement));
      
      weeklyRank = allWeeklyTrendsQuery.findIndex(trend => trend.studentId === student.id) + 1;
    }
    
    return {
      student,
      stats,
      currentStreak,
      weeklyRank,
      badges: badgesList,
      weeklyProgress,
      dailyActivity,
    };
  }

  async getAdminDashboardData(): Promise<AdminDashboardData> {
    const allStudents = await this.getAllStudents();
    const totalStudents = allStudents.length;
    
    let activeStudents = 0;
    let totalProblems = 0;
    let underperforming = 0;
    
    const studentsWithStats = await Promise.all(
      allStudents.map(async (student) => {
        const stats = await this.getStudentStats(student.id) || {
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          acceptanceRate: 0,
          ranking: 0,
        };
        
        const currentWeek = await this.getCurrentWeekTrend(student.id);
        const weeklyProgress = currentWeek?.weeklyIncrement || 0;
        const streak = await this.calculateStreak(student.id);
        
        totalProblems += stats.totalSolved;
        
        if (weeklyProgress > 0) activeStudents++;
        if (weeklyProgress < 5) underperforming++;
        
        const status = weeklyProgress >= 15 ? 'Excellent' : 
                      weeklyProgress >= 5 ? 'Active' : 'Underperforming';
        
        return {
          ...student,
          stats,
          weeklyProgress,
          streak,
          status,
        };
      })
    );
    
    const avgProblems = totalStudents > 0 ? Math.round((totalProblems / totalStudents) * 10) / 10 : 0;
    
    // Create leaderboard
    const leaderboard = studentsWithStats
      .sort((a, b) => b.weeklyProgress - a.weeklyProgress)
      .slice(0, 10)
      .map((student, index) => ({
        rank: index + 1,
        student: {
          id: student.id,
          name: student.name,
          leetcodeUsername: student.leetcodeUsername,
          leetcodeProfileLink: student.leetcodeProfileLink,
          createdAt: student.createdAt,
        },
        weeklyScore: student.weeklyProgress,
      }));
    
    return {
      totalStudents,
      activeStudents,
      avgProblems,
      underperforming,
      students: studentsWithStats,
      leaderboard,
    };
  }

  async getLeaderboard(limit = 10): Promise<AdminDashboardData['leaderboard']> {
    const adminData = await this.getAdminDashboardData();
    return adminData.leaderboard.slice(0, limit);
  }
}

export const storage = new DatabaseStorage();
