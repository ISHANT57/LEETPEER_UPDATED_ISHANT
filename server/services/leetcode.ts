import { storage } from "../storage";
import type { LeetCodeStats } from "@shared/schema";

interface LeetCodeResponse {
  data: {
    matchedUser: {
      username: string;
      submitStats: {
        acSubmissionNum: Array<{
          difficulty: string;
          count: number;
        }>;
      };
      problemsSolvedBeatsStats: Array<{
        difficulty: string;
        percentage: number;
      }>;
    } | null;
  };
}

export class LeetCodeService {
  private readonly GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";
  
  private readonly USER_PROFILE_QUERY = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        problemsSolvedBeatsStats {
          difficulty
          percentage
        }
      }
    }
  `;

  async fetchUserStats(username: string): Promise<LeetCodeStats | null> {
    try {
      const response = await fetch(this.GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          query: this.USER_PROFILE_QUERY,
          variables: { username }
        })
      });

      if (!response.ok) {
        console.error(`LeetCode API error for ${username}: ${response.status}`);
        return null;
      }

      const data: LeetCodeResponse = await response.json();
      
      if (!data.data?.matchedUser) {
        console.error(`User not found: ${username}`);
        return null;
      }

      const submitStats = data.data.matchedUser.submitStats.acSubmissionNum;
      const totalSolved = submitStats.find(stat => stat.difficulty === "All")?.count || 0;
      const easySolved = submitStats.find(stat => stat.difficulty === "Easy")?.count || 0;
      const mediumSolved = submitStats.find(stat => stat.difficulty === "Medium")?.count || 0;
      const hardSolved = submitStats.find(stat => stat.difficulty === "Hard")?.count || 0;

      const beatsStats = data.data.matchedUser.problemsSolvedBeatsStats;
      const acceptanceRate = beatsStats.reduce((acc, stat) => acc + (stat.percentage || 0), 0) / beatsStats.length;

      return {
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        ranking: 0, // LeetCode doesn't provide global ranking in this query
      };
    } catch (error) {
      console.error(`Error fetching LeetCode data for ${username}:`, error);
      return null;
    }
  }

  async syncStudentData(studentId: string): Promise<boolean> {
    try {
      const student = await storage.getStudent(studentId);
      if (!student) return false;

      const stats = await this.fetchUserStats(student.leetcodeUsername);
      if (!stats) return false;

      const today = new Date().toISOString().split('T')[0];
      const existingProgress = await storage.getDailyProgress(studentId, today);
      
      let dailyIncrement = 0;
      if (existingProgress) {
        dailyIncrement = stats.totalSolved - existingProgress.totalSolved;
        await storage.updateDailyProgress(studentId, today, {
          totalSolved: stats.totalSolved,
          easySolved: stats.easySolved,
          mediumSolved: stats.mediumSolved,
          hardSolved: stats.hardSolved,
          dailyIncrement,
        });
      } else {
        // For new entries, calculate increment from yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayProgress = await storage.getDailyProgress(studentId, yesterdayStr);
        
        dailyIncrement = yesterdayProgress ? 
          stats.totalSolved - yesterdayProgress.totalSolved : 
          stats.totalSolved;

        await storage.createDailyProgress({
          studentId,
          date: today,
          totalSolved: stats.totalSolved,
          easySolved: stats.easySolved,
          mediumSolved: stats.mediumSolved,
          hardSolved: stats.hardSolved,
          dailyIncrement,
        });
      }

      // Update weekly trend
      await this.updateWeeklyTrend(studentId, stats.totalSolved);
      
      // Check for badge achievements
      await this.checkBadgeAchievements(studentId, stats, dailyIncrement);

      return true;
    } catch (error) {
      console.error(`Error syncing student data for ${studentId}:`, error);
      return false;
    }
  }

  async syncAllStudents(): Promise<{ success: number; failed: number }> {
    const students = await storage.getAllStudents();
    const results = await Promise.allSettled(
      students.map(student => this.syncStudentData(student.id))
    );

    const success = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - success;

    // Update last sync time
    await storage.updateAppSettings({
      lastSyncTime: new Date(),
    });

    return { success, failed };
  }

  private async updateWeeklyTrend(studentId: string, totalSolved: number): Promise<void> {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    const existingTrend = await storage.getCurrentWeekTrend(studentId);
    
    if (existingTrend) {
      const weeklyIncrement = totalSolved - (existingTrend.totalProblems - existingTrend.weeklyIncrement);
      // Update would need to be implemented in storage
    } else {
      // Get last week's total to calculate increment
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekTrends = await storage.getWeeklyTrends(studentId, 1);
      const lastWeekTotal = lastWeekTrends.length > 0 ? lastWeekTrends[0].totalProblems : 0;
      
      const weeklyIncrement = totalSolved - lastWeekTotal;
      
      await storage.createWeeklyTrend({
        studentId,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        totalProblems: totalSolved,
        weeklyIncrement,
        ranking: 0, // Will be calculated later
      });
    }
  }

  private async checkBadgeAchievements(
    studentId: string, 
    stats: LeetCodeStats, 
    dailyIncrement: number
  ): Promise<void> {
    // Check for Century Coder badge
    if (stats.totalSolved >= 100) {
      const hascenturyBadge = await storage.hasStudentEarnedBadge(studentId, 'century_coder');
      if (!hascenturyBadge) {
        await storage.createBadge({
          studentId,
          badgeType: 'century_coder',
          title: 'Century Coder',
          description: '100+ problems solved',
          icon: 'fas fa-code',
        });
      }
    }

    // Check for Streak Master badge
    const streak = await storage.calculateStreak(studentId);
    if (streak >= 7) {
      const hasStreakBadge = await storage.hasStudentEarnedBadge(studentId, 'streak_master');
      if (!hasStreakBadge) {
        await storage.createBadge({
          studentId,
          badgeType: 'streak_master',
          title: 'Streak Master',
          description: '7-day streak of 5+ daily problems',
          icon: 'fas fa-fire',
        });
      }
    }

    // Check for big improvement (Comeback Coder)
    if (dailyIncrement >= 10) {
      await storage.createBadge({
        studentId,
        badgeType: 'comeback_coder',
        title: 'Comeback Coder',
        description: 'Big daily improvement',
        icon: 'fas fa-chart-line',
      });
    }
  }
}

export const leetCodeService = new LeetCodeService();
