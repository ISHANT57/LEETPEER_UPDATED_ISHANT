
import { 
  type Student, 
  type InsertStudent,
  type DailyProgress,
  type InsertDailyProgress,
  type WeeklyTrend,
  type InsertWeeklyTrend,
  type Badge,
  type InsertBadge,
  type User,
  type InsertUser,
  type AppSettings,
  type LeetCodeStats,
  type StudentDashboardData,
  type AdminDashboardData,
  students,
  dailyProgress,
  weeklyTrends,
  badges,
  users,
  appSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

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
  getBadgeByType(studentId: string, badgeType: string): Promise<Badge | undefined>;
  getAllBadgesData(): Promise<any>;

  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings>;

  // Dashboard data
  getStudentDashboard(studentId: string): Promise<StudentDashboardData | undefined>;
  getAdminDashboard(): Promise<AdminDashboardData>;
  getLeaderboard(): Promise<Array<{ rank: number; student: Student; weeklyScore: number }>>;

  // User management
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;

  // Helper methods
  hasStudentEarnedBadge(studentId: string, badgeType: string): Promise<boolean>;
  calculateStreak(studentId: string): Promise<number>;
}

export class PostgreSQLStorage implements IStorage {
  // Students
  async getStudent(id: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0];
  }

  async getStudentByUsername(username: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.leetcodeUsername, username)).limit(1);
    return result[0];
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values(insertStudent).returning();
    return result[0];
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const result = await db.update(students).set(updates).where(eq(students.id, id)).returning();
    return result[0];
  }

  // Daily Progress
  async getDailyProgress(studentId: string, date: string): Promise<DailyProgress | undefined> {
    const result = await db.select().from(dailyProgress)
      .where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date)))
      .limit(1);
    return result[0];
  }

  async getStudentDailyProgress(studentId: string, days = 30): Promise<DailyProgress[]> {
    return await db.select().from(dailyProgress)
      .where(eq(dailyProgress.studentId, studentId))
      .orderBy(desc(dailyProgress.date))
      .limit(days);
  }

  async createDailyProgress(insertProgress: InsertDailyProgress): Promise<DailyProgress> {
    const result = await db.insert(dailyProgress).values(insertProgress).returning();
    return result[0];
  }

  async updateDailyProgress(studentId: string, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress | undefined> {
    const result = await db.update(dailyProgress)
      .set(updates)
      .where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date)))
      .returning();
    return result[0];
  }

  // Weekly Trends
  async getWeeklyTrends(studentId: string, weeks = 12): Promise<WeeklyTrend[]> {
    return await db.select().from(weeklyTrends)
      .where(eq(weeklyTrends.studentId, studentId))
      .orderBy(desc(weeklyTrends.weekStart))
      .limit(weeks);
  }

  async createWeeklyTrend(insertTrend: InsertWeeklyTrend): Promise<WeeklyTrend> {
    const result = await db.insert(weeklyTrends).values(insertTrend).returning();
    return result[0];
  }

  async getCurrentWeekTrend(studentId: string): Promise<WeeklyTrend | undefined> {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekStart = startOfWeek.toISOString().split('T')[0];
    
    const result = await db.select().from(weeklyTrends)
      .where(and(eq(weeklyTrends.studentId, studentId), eq(weeklyTrends.weekStart, weekStart)))
      .limit(1);
    return result[0];
  }

  // Badges
  async getStudentBadges(studentId: string): Promise<Badge[]> {
    return await db.select().from(badges)
      .where(eq(badges.studentId, studentId))
      .orderBy(desc(badges.earnedAt));
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const result = await db.insert(badges).values(insertBadge).returning();
    return result[0];
  }

  async getBadgeByType(studentId: string, badgeType: string): Promise<Badge | undefined> {
    const result = await db.select().from(badges)
      .where(and(eq(badges.studentId, studentId), eq(badges.badgeType, badgeType)))
      .limit(1);
    return result[0];
  }

  async getAllBadgesData(): Promise<any> {
    // Get all badges with student information
    const allBadges = await db.select({
      id: badges.id,
      studentId: badges.studentId,
      badgeType: badges.badgeType,
      title: badges.title,
      description: badges.description,
      icon: badges.icon,
      earnedAt: badges.earnedAt,
      studentName: students.name,
      studentUsername: students.leetcodeUsername
    })
    .from(badges)
    .innerJoin(students, eq(badges.studentId, students.id))
    .orderBy(desc(badges.earnedAt));

    // Transform badges to include student info
    const badgesWithStudents = allBadges.map(badge => ({
      id: badge.id,
      studentId: badge.studentId,
      badgeType: badge.badgeType,
      title: badge.title,
      description: badge.description,
      icon: badge.icon,
      earnedAt: badge.earnedAt,
      student: {
        id: badge.studentId,
        name: badge.studentName,
        leetcodeUsername: badge.studentUsername
      }
    }));

    // Calculate badge statistics
    const totalBadges = allBadges.length;
    const uniqueRecipients = new Set(allBadges.map(b => b.studentId)).size;
    
    // Find most popular badge type
    const badgeTypeCounts = allBadges.reduce((counts, badge) => {
      counts[badge.badgeType] = (counts[badge.badgeType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const mostPopularBadge = Object.keys(badgeTypeCounts).reduce((a, b) => 
      badgeTypeCounts[a] > badgeTypeCounts[b] ? a : b, Object.keys(badgeTypeCounts)[0] || ''
    );

    // Get recent badges (last 10)
    const recentBadges = badgesWithStudents.slice(0, 10);

    return {
      allBadges: badgesWithStudents,
      badgeStats: {
        totalBadges,
        totalRecipients: uniqueRecipients,
        mostPopularBadge,
        recentBadges
      }
    };
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const result = await db.select().from(appSettings).limit(1);
    return result[0];
  }

  async updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    // Try to update first, if no rows affected, insert
    const existing = await this.getAppSettings();
    if (existing) {
      const result = await db.update(appSettings).set(updates).where(eq(appSettings.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(appSettings).values(updates as any).returning();
      return result[0];
    }
  }

  // Dashboard methods
  async getStudentDashboard(studentId: string): Promise<StudentDashboardData | undefined> {
    const student = await this.getStudent(studentId);
    if (!student) return undefined;

    const [dailyProgress, badges, weeklyTrends] = await Promise.all([
      this.getStudentDailyProgress(studentId, 30),
      this.getStudentBadges(studentId),
      this.getWeeklyTrends(studentId, 12)
    ]);

    const latestProgress = dailyProgress[0];
    const stats: LeetCodeStats = latestProgress ? {
      totalSolved: latestProgress.totalSolved,
      easySolved: latestProgress.easySolved,
      mediumSolved: latestProgress.mediumSolved,
      hardSolved: latestProgress.hardSolved,
      acceptanceRate: 0,
      ranking: 0
    } : {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0,
      ranking: 0
    };

    return {
      student,
      stats,
      currentStreak: this.calculateStreakFromProgress(dailyProgress),
      weeklyRank: 1,
      badges,
      weeklyProgress: weeklyTrends.map(t => t.weeklyIncrement),
      dailyActivity: dailyProgress.map(p => ({
        date: p.date,
        count: p.dailyIncrement
      }))
    };
  }

  async getAdminDashboard(): Promise<AdminDashboardData> {
    const students = await this.getAllStudents();
    const totalStudents = students.length;

    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const latestProgressResult = await db.select().from(dailyProgress)
          .where(eq(dailyProgress.studentId, student.id))
          .orderBy(desc(dailyProgress.date))
          .limit(1);
        
        const latestProgress = latestProgressResult[0];
        
        const stats: LeetCodeStats = latestProgress ? {
          totalSolved: latestProgress.totalSolved,
          easySolved: latestProgress.easySolved,
          mediumSolved: latestProgress.mediumSolved,
          hardSolved: latestProgress.hardSolved,
          acceptanceRate: 0,
          ranking: 0
        } : {
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          acceptanceRate: 0,
          ranking: 0
        };

        return {
          ...student,
          stats,
          weeklyProgress: 0,
          streak: 0,
          status: stats.totalSolved > 0 ? 'active' : 'inactive'
        };
      })
    );

    const activeStudents = studentsWithStats.filter(s => s.status === 'active').length;
    const avgProblems = studentsWithStats.reduce((sum, s) => sum + s.stats.totalSolved, 0) / totalStudents;
    const underperforming = studentsWithStats.filter(s => s.stats.totalSolved < avgProblems * 0.7).length;

    const leaderboard = studentsWithStats
      .sort((a, b) => b.stats.totalSolved - a.stats.totalSolved)
      .slice(0, 10)
      .map((student, index) => ({
        rank: index + 1,
        student: {
          id: student.id,
          name: student.name,
          leetcodeUsername: student.leetcodeUsername,
          leetcodeProfileLink: student.leetcodeProfileLink,
          createdAt: student.createdAt
        },
        weeklyScore: student.stats.totalSolved
      }));

    return {
      totalStudents,
      activeStudents,
      avgProblems,
      underperforming,
      students: studentsWithStats,
      leaderboard
    };
  }

  async getLeaderboard(): Promise<Array<{ rank: number; student: Student; weeklyScore: number }>> {
    const students = await this.getAllStudents();
    
    const studentsWithScores = await Promise.all(
      students.map(async (student) => {
        const latestProgressResult = await db.select().from(dailyProgress)
          .where(eq(dailyProgress.studentId, student.id))
          .orderBy(desc(dailyProgress.date))
          .limit(1);
        
        const latestProgress = latestProgressResult[0];
        
        return {
          student,
          weeklyScore: latestProgress?.totalSolved || 0
        };
      })
    );

    return studentsWithScores
      .sort((a, b) => b.weeklyScore - a.weeklyScore)
      .map((item, index) => ({
        rank: index + 1,
        ...item
      }));
  }

  // User management
  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }

  // Helper methods
  async hasStudentEarnedBadge(studentId: string, badgeType: string): Promise<boolean> {
    const badge = await this.getBadgeByType(studentId, badgeType);
    return badge !== undefined;
  }

  async calculateStreak(studentId: string): Promise<number> {
    const progress = await this.getStudentDailyProgress(studentId, 30);
    let streak = 0;
    for (const p of progress) {
      if (p.dailyIncrement > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  private calculateStreakFromProgress(progress: DailyProgress[]): number {
    let streak = 0;
    for (const p of progress) {
      if (p.dailyIncrement > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}

export const storage = new PostgreSQLStorage();
