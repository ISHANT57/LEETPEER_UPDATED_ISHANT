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

export class MemStorage implements IStorage {
  private students: Map<string, Student> = new Map();
  private dailyProgress: Map<string, DailyProgress> = new Map();
  private weeklyTrends: Map<string, WeeklyTrend> = new Map();
  private badges: Map<string, Badge> = new Map();
  private appSettings: AppSettings | null = null;

  constructor() {
    // Initialize with default app settings
    this.appSettings = {
      id: randomUUID(),
      lastSyncTime: null,
      isAutoSyncEnabled: true,
    };
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByUsername(username: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      student => student.leetcodeUsername === username
    );
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = {
      ...insertStudent,
      id,
      createdAt: new Date(),
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    
    const updatedStudent = { ...student, ...updates };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async getDailyProgress(studentId: string, date: string): Promise<DailyProgress | undefined> {
    const key = `${studentId}-${date}`;
    return this.dailyProgress.get(key);
  }

  async getStudentDailyProgress(studentId: string, days = 30): Promise<DailyProgress[]> {
    return Array.from(this.dailyProgress.values())
      .filter(progress => progress.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days);
  }

  async createDailyProgress(insertProgress: InsertDailyProgress): Promise<DailyProgress> {
    const id = randomUUID();
    const progress: DailyProgress = {
      id,
      studentId: insertProgress.studentId,
      date: insertProgress.date,
      totalSolved: insertProgress.totalSolved || 0,
      easySolved: insertProgress.easySolved || 0,
      mediumSolved: insertProgress.mediumSolved || 0,
      hardSolved: insertProgress.hardSolved || 0,
      dailyIncrement: insertProgress.dailyIncrement || 0,
      createdAt: new Date(),
    };
    const key = `${insertProgress.studentId}-${insertProgress.date}`;
    this.dailyProgress.set(key, progress);
    return progress;
  }

  async updateDailyProgress(studentId: string, date: string, updates: Partial<DailyProgress>): Promise<DailyProgress | undefined> {
    const key = `${studentId}-${date}`;
    const progress = this.dailyProgress.get(key);
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...updates };
    this.dailyProgress.set(key, updatedProgress);
    return updatedProgress;
  }

  async getWeeklyTrends(studentId: string, weeks = 12): Promise<WeeklyTrend[]> {
    return Array.from(this.weeklyTrends.values())
      .filter(trend => trend.studentId === studentId)
      .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
      .slice(0, weeks);
  }

  async createWeeklyTrend(insertTrend: InsertWeeklyTrend): Promise<WeeklyTrend> {
    const id = randomUUID();
    const trend: WeeklyTrend = {
      id,
      studentId: insertTrend.studentId,
      weekStart: insertTrend.weekStart,
      weekEnd: insertTrend.weekEnd,
      totalProblems: insertTrend.totalProblems || 0,
      weeklyIncrement: insertTrend.weeklyIncrement || 0,
      ranking: insertTrend.ranking || 0,
      createdAt: new Date(),
    };
    this.weeklyTrends.set(id, trend);
    return trend;
  }

  async getCurrentWeekTrend(studentId: string): Promise<WeeklyTrend | undefined> {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    return Array.from(this.weeklyTrends.values()).find(
      trend => trend.studentId === studentId && trend.weekStart === weekStartStr
    );
  }

  async getStudentBadges(studentId: string): Promise<Badge[]> {
    return Array.from(this.badges.values())
      .filter(badge => badge.studentId === studentId)
      .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime());
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const id = randomUUID();
    const badge: Badge = {
      ...insertBadge,
      id,
      earnedAt: new Date(),
    };
    this.badges.set(id, badge);
    return badge;
  }

  async hasStudentEarnedBadge(studentId: string, badgeType: string): Promise<boolean> {
    return Array.from(this.badges.values()).some(
      badge => badge.studentId === studentId && badge.badgeType === badgeType
    );
  }

  async getAppSettings(): Promise<AppSettings | undefined> {
    return this.appSettings || undefined;
  }

  async updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    this.appSettings = { ...this.appSettings!, ...settings };
    return this.appSettings;
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
    const badges = await this.getStudentBadges(student.id);
    const weeklyTrends = await this.getWeeklyTrends(student.id, 7);
    const dailyProgressList = await this.getStudentDailyProgress(student.id, 30);
    
    const weeklyProgress = weeklyTrends.map(trend => trend.weeklyIncrement);
    const dailyActivity = dailyProgressList.map(progress => ({
      date: progress.date,
      count: progress.dailyIncrement,
    }));
    
    // Calculate weekly rank (simplified)
    const allWeeklyTrends = Array.from(this.weeklyTrends.values())
      .filter(trend => trend.weekStart === weeklyTrends[0]?.weekStart)
      .sort((a, b) => b.weeklyIncrement - a.weeklyIncrement);
    
    const weeklyRank = allWeeklyTrends.findIndex(trend => trend.studentId === student.id) + 1;
    
    return {
      student,
      stats,
      currentStreak,
      weeklyRank,
      badges,
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

export const storage = new MemStorage();
