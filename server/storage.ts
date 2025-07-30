
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
  type AdminDashboardData
} from "@shared/schema";
import { getDB } from "./mongodb";
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
  getBadgeByType(studentId: string, badgeType: string): Promise<Badge | undefined>;

  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings>;

  // Dashboard data
  getStudentDashboard(studentId: string): Promise<StudentDashboardData | undefined>;
  getAdminDashboard(): Promise<AdminDashboardData>;
  getLeaderboard(): Promise<Array<{ rank: number; student: Student; weeklyScore: number }>>;
}

export class MongoDBStorage implements IStorage {
  private get db() {
    return getDB();
  }

  // Students
  async getStudent(id: string): Promise<Student | undefined> {
    const student = await this.db.collection('students').findOne({ id });
    return student ? this.formatStudent(student) : undefined;
  }

  async getStudentByUsername(username: string): Promise<Student | undefined> {
    const student = await this.db.collection('students').findOne({ leetcodeUsername: username });
    return student ? this.formatStudent(student) : undefined;
  }

  async getAllStudents(): Promise<Student[]> {
    const students = await this.db.collection('students').find({}).toArray();
    return students.map(this.formatStudent);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const student: Student = {
      id: randomUUID(),
      ...insertStudent,
      createdAt: new Date()
    };
    
    await this.db.collection('students').insertOne(student);
    return student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const result = await this.db.collection('students').findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? this.formatStudent(result) : undefined;
  }

  // Daily Progress
  async getDailyProgress(studentId: string, date: string): Promise<DailyProgress | undefined> {
    const progress = await this.db.collection('dailyProgress').findOne({ studentId, date });
    return progress ? this.formatDailyProgress(progress) : undefined;
  }

  async getStudentDailyProgress(studentId: string, days = 30): Promise<DailyProgress[]> {
    const progress = await this.db.collection('dailyProgress')
      .find({ studentId })
      .sort({ date: -1 })
      .limit(days)
      .toArray();
    return progress.map(this.formatDailyProgress);
  }

  async createDailyProgress(insertProgress: InsertDailyProgress): Promise<DailyProgress> {
    const progress: DailyProgress = {
      id: randomUUID(),
      ...insertProgress,
      createdAt: new Date()
    };
    
    await this.db.collection('dailyProgress').insertOne(progress);
    return progress;
  }

  async updateDailyProgress(studentId: string, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress | undefined> {
    const result = await this.db.collection('dailyProgress').findOneAndUpdate(
      { studentId, date },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? this.formatDailyProgress(result) : undefined;
  }

  // Weekly Trends
  async getWeeklyTrends(studentId: string, weeks = 12): Promise<WeeklyTrend[]> {
    const trends = await this.db.collection('weeklyTrends')
      .find({ studentId })
      .sort({ weekStart: -1 })
      .limit(weeks)
      .toArray();
    return trends.map(this.formatWeeklyTrend);
  }

  async createWeeklyTrend(insertTrend: InsertWeeklyTrend): Promise<WeeklyTrend> {
    const trend: WeeklyTrend = {
      id: randomUUID(),
      ...insertTrend,
      createdAt: new Date()
    };
    
    await this.db.collection('weeklyTrends').insertOne(trend);
    return trend;
  }

  async getCurrentWeekTrend(studentId: string): Promise<WeeklyTrend | undefined> {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekStart = startOfWeek.toISOString().split('T')[0];
    
    const trend = await this.db.collection('weeklyTrends').findOne({ studentId, weekStart });
    return trend ? this.formatWeeklyTrend(trend) : undefined;
  }

  // Badges
  async getStudentBadges(studentId: string): Promise<Badge[]> {
    const badges = await this.db.collection('badges')
      .find({ studentId })
      .sort({ earnedAt: -1 })
      .toArray();
    return badges.map(this.formatBadge);
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const badge: Badge = {
      id: randomUUID(),
      ...insertBadge,
      earnedAt: new Date()
    };
    
    await this.db.collection('badges').insertOne(badge);
    return badge;
  }

  async getBadgeByType(studentId: string, badgeType: string): Promise<Badge | undefined> {
    const badge = await this.db.collection('badges').findOne({ studentId, badgeType });
    return badge ? this.formatBadge(badge) : undefined;
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const settings = await this.db.collection('appSettings').findOne({});
    return settings ? this.formatAppSettings(settings) : undefined;
  }

  async updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const result = await this.db.collection('appSettings').findOneAndUpdate(
      {},
      { $set: updates },
      { upsert: true, returnDocument: 'after' }
    );
    return this.formatAppSettings(result!);
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
      currentStreak: this.calculateStreak(dailyProgress),
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
        const latestProgress = await this.db.collection('dailyProgress')
          .findOne({ studentId: student.id }, { sort: { date: -1 } });
        
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
        const latestProgress = await this.db.collection('dailyProgress')
          .findOne({ studentId: student.id }, { sort: { date: -1 } });
        
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
  private formatStudent(doc: any): Student {
    return {
      id: doc.id,
      name: doc.name,
      leetcodeUsername: doc.leetcodeUsername,
      leetcodeProfileLink: doc.leetcodeProfileLink,
      createdAt: doc.createdAt
    };
  }

  private formatDailyProgress(doc: any): DailyProgress {
    return {
      id: doc.id,
      studentId: doc.studentId,
      date: doc.date,
      totalSolved: doc.totalSolved,
      easySolved: doc.easySolved,
      mediumSolved: doc.mediumSolved,
      hardSolved: doc.hardSolved,
      dailyIncrement: doc.dailyIncrement,
      createdAt: doc.createdAt
    };
  }

  private formatWeeklyTrend(doc: any): WeeklyTrend {
    return {
      id: doc.id,
      studentId: doc.studentId,
      weekStart: doc.weekStart,
      weekEnd: doc.weekEnd,
      totalProblems: doc.totalProblems,
      weeklyIncrement: doc.weeklyIncrement,
      ranking: doc.ranking,
      createdAt: doc.createdAt
    };
  }

  private formatBadge(doc: any): Badge {
    return {
      id: doc.id,
      studentId: doc.studentId,
      badgeType: doc.badgeType,
      title: doc.title,
      description: doc.description,
      icon: doc.icon,
      earnedAt: doc.earnedAt
    };
  }

  private formatAppSettings(doc: any): AppSettings {
    return {
      id: doc.id,
      lastSyncTime: doc.lastSyncTime,
      isAutoSyncEnabled: doc.isAutoSyncEnabled
    };
  }

  private calculateStreak(progress: DailyProgress[]): number {
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

export const storage = new MongoDBStorage();
