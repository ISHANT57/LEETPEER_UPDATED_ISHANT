
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
  type WeeklyProgressData,
  type InsertWeeklyProgressData,
  type LeetCodeStats,
  type StudentDashboardData,
  type AdminDashboardData,
  students,
  dailyProgress,
  weeklyTrends,
  badges,
  appSettings,
  weeklyProgressData
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
  deleteStudent(id: string): Promise<boolean>;
  deleteStudentByUsername(username: string): Promise<boolean>;

  // Daily Progress
  getDailyProgress(studentId: string, date: string): Promise<DailyProgress | undefined>;
  getStudentDailyProgress(studentId: string, days?: number): Promise<DailyProgress[]>;
  createDailyProgress(progress: InsertDailyProgress): Promise<DailyProgress>;
  updateDailyProgress(studentId: string, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress | undefined>;
  deleteDailyProgress(studentId: string, date: string): Promise<boolean>;

  // Weekly Trends
  getWeeklyTrends(studentId: string, weeks?: number): Promise<WeeklyTrend[]>;
  createWeeklyTrend(trend: InsertWeeklyTrend): Promise<WeeklyTrend>;
  getCurrentWeekTrend(studentId: string): Promise<WeeklyTrend | undefined>;
  deleteWeeklyTrend(studentId: string, weekStart: string): Promise<boolean>;

  // Weekly Progress Data
  getWeeklyProgressData(studentId: string): Promise<WeeklyProgressData | undefined>;
  getAllWeeklyProgressData(): Promise<WeeklyProgressData[]>;
  createWeeklyProgressData(data: InsertWeeklyProgressData): Promise<WeeklyProgressData>;
  updateWeeklyProgressData(studentId: string, updates: Partial<WeeklyProgressData>): Promise<WeeklyProgressData | undefined>;
  deleteWeeklyProgressData(studentId: string): Promise<boolean>;

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

  // Helper methods
  hasStudentEarnedBadge(studentId: string, badgeType: string): Promise<boolean>;
  calculateStreak(studentId: string): Promise<number>;
  getWeeklyTrend(studentId: string, weekStart: string): Promise<WeeklyTrend | undefined>;
  getLatestDailyProgress(studentId: string): Promise<DailyProgress | undefined>;
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

  async deleteStudent(id: string): Promise<boolean> {
    try {
      // First delete all related data
      await db.delete(badges).where(eq(badges.studentId, id));
      await db.delete(weeklyTrends).where(eq(weeklyTrends.studentId, id));
      await db.delete(dailyProgress).where(eq(dailyProgress.studentId, id));
      
      // Then delete the student
      const result = await db.delete(students).where(eq(students.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }

  async deleteStudentByUsername(username: string): Promise<boolean> {
    try {
      const student = await this.getStudentByUsername(username);
      if (!student) return false;
      
      return await this.deleteStudent(student.id);
    } catch (error) {
      console.error('Error deleting student by username:', error);
      return false;
    }
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

  async deleteWeeklyTrend(studentId: string, weekStart: string): Promise<boolean> {
    try {
      await db.delete(weeklyTrends)
        .where(and(eq(weeklyTrends.studentId, studentId), eq(weeklyTrends.weekStart, weekStart)));
      return true;
    } catch (error) {
      console.error('Error deleting weekly trend:', error);
      return false;
    }
  }

  async deleteDailyProgress(studentId: string, date: string): Promise<boolean> {
    try {
      await db.delete(dailyProgress)
        .where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date)));
      return true;
    } catch (error) {
      console.error('Error deleting daily progress:', error);
      return false;
    }
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
      acceptanceRate: latestProgress.acceptanceRate || 0,
      ranking: latestProgress.ranking || 0,
      totalSubmissions: latestProgress.totalSubmissions || 0,
      totalAccepted: latestProgress.totalAccepted || 0,
      languageStats: (latestProgress.languageStats as Record<string, number>) || {} as Record<string, number>
    } : {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0,
      ranking: 0,
      totalSubmissions: 0,
      totalAccepted: 0,
      languageStats: {} as Record<string, number>
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
        const [latestProgressResult, weeklyProgressResult, recentProgressResult] = await Promise.all([
          db.select().from(dailyProgress)
            .where(eq(dailyProgress.studentId, student.id))
            .orderBy(desc(dailyProgress.date))
            .limit(1),
          db.select().from(weeklyProgressData)
            .where(eq(weeklyProgressData.studentId, student.id))
            .limit(1),
          db.select().from(dailyProgress)
            .where(eq(dailyProgress.studentId, student.id))
            .orderBy(desc(dailyProgress.date))
            .limit(7) // Get last 7 days for streak calculation
        ]);
        
        const latestProgress = latestProgressResult[0];
        const weeklyProgress = weeklyProgressResult[0];
        
        const stats: LeetCodeStats = latestProgress ? {
          totalSolved: latestProgress.totalSolved,
          easySolved: latestProgress.easySolved,
          mediumSolved: latestProgress.mediumSolved,
          hardSolved: latestProgress.hardSolved,
          acceptanceRate: latestProgress.acceptanceRate || 0,
          ranking: latestProgress.ranking || 0,
          totalSubmissions: latestProgress.totalSubmissions || 0,
          totalAccepted: latestProgress.totalAccepted || 0,
          languageStats: (latestProgress.languageStats as Record<string, number>) || {} as Record<string, number>
        } : {
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          acceptanceRate: 0,
          ranking: 0,
          totalSubmissions: 0,
          totalAccepted: 0,
          languageStats: {} as Record<string, number>
        };

        // Calculate real-time weekly progress
        const currentWeeklyProgress = weeklyProgress ? 
          (latestProgress?.totalSolved || 0) - (weeklyProgress.week4Score || 0) : 0;

        // Calculate streak from recent progress
        const streak = this.calculateStreakFromProgress(recentProgressResult);

        // Determine better status based on recent activity
        let status = 'inactive';
        if (stats.totalSolved > 0) {
          if (currentWeeklyProgress >= 10) {
            status = 'Excellent';
          } else if (currentWeeklyProgress >= 5 || streak >= 3) {
            status = 'Active';
          } else if (stats.totalSolved > 0) {
            status = 'Underperforming';
          }
        }

        return {
          ...student,
          stats,
          weeklyProgress: Math.max(0, currentWeeklyProgress),
          streak,
          status
        };
      })
    );

    const activeStudents = studentsWithStats.filter(s => s.status !== 'inactive').length;
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

  async getWeeklyTrend(studentId: string, weekStart: string): Promise<WeeklyTrend | undefined> {
    const result = await db.select().from(weeklyTrends)
      .where(and(eq(weeklyTrends.studentId, studentId), eq(weeklyTrends.weekStart, weekStart)))
      .limit(1);
    return result[0];
  }

  async getLatestDailyProgress(studentId: string): Promise<DailyProgress | undefined> {
    const result = await db.select().from(dailyProgress)
      .where(eq(dailyProgress.studentId, studentId))
      .orderBy(desc(dailyProgress.date))
      .limit(1);
    return result[0];
  }

  // Weekly Progress Data methods
  async getWeeklyProgressData(studentId: string): Promise<WeeklyProgressData | undefined> {
    const result = await db.select().from(weeklyProgressData)
      .where(eq(weeklyProgressData.studentId, studentId))
      .limit(1);
    return result[0];
  }

  async getAllWeeklyProgressData(): Promise<WeeklyProgressData[]> {
    return await db.select().from(weeklyProgressData);
  }

  async createWeeklyProgressData(data: InsertWeeklyProgressData): Promise<WeeklyProgressData> {
    const result = await db.insert(weeklyProgressData).values(data).returning();
    return result[0];
  }

  async updateWeeklyProgressData(studentId: string, updates: Partial<WeeklyProgressData>): Promise<WeeklyProgressData | undefined> {
    const result = await db.update(weeklyProgressData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(weeklyProgressData.studentId, studentId))
      .returning();
    return result[0];
  }

  async deleteWeeklyProgressData(studentId: string): Promise<boolean> {
    const result = await db.delete(weeklyProgressData)
      .where(eq(weeklyProgressData.studentId, studentId));
    return result.rowCount ? result.rowCount > 0 : false;
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
