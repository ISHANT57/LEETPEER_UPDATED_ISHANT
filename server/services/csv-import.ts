import fs from 'fs/promises';
import path from 'path';
import { storage } from '../storage';

interface CSVStudentData {
  id: string;
  name: string;
  leetcodeUsername: string;
  leetcodeProfileLink: string;
  week1Solved: number;
  week1Rank: string;
  week2Solved: number;
  week2Rank: string;
  week2Increment: number;
  week2RankImprovement: string;
  week3Solved: number;
  week3Rank: string;
  week3Increment: number;
  week4Solved?: number;
  week5Solved?: number;
}

export class CSVImportService {
  
  /**
   * Parse CSV content and extract student data
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Clean and parse numeric values from CSV
   */
  private parseNumber(value: string): number {
    if (!value || value === '#VALUE!' || value === 'Went home' || value === 'Leave') {
      return 0;
    }
    
    // Remove quotes and commas
    const cleaned = value.replace(/["',]/g, '');
    
    // Handle special cases
    if (cleaned.includes('~') || cleaned.includes('+')) {
      return parseInt(cleaned.replace(/[~+]/g, '')) || 0;
    }
    
    const num = parseInt(cleaned) || 0;
    return isNaN(num) ? 0 : num;
  }

  /**
   * Parse rank improvement string
   */
  private parseRankImprovement(value: string): number {
    if (!value || value === '#VALUE!' || value === '0') {
      return 0;
    }
    
    const cleaned = value.replace(/["',]/g, '');
    return parseInt(cleaned) || 0;
  }

  /**
   * Import student data from CSV file
   */
  async importFromCSV(csvFilePath: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    try {
      const csvContent = await fs.readFile(csvFilePath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Skip header line
      const dataLines = lines.slice(1);
      
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const line of dataLines) {
        try {
          const fields = this.parseCSVLine(line);
          
          if (fields.length < 10 || !fields[0] || !fields[1] || !fields[2]) {
            skipped++;
            continue;
          }

          const studentData: CSVStudentData = {
            id: fields[0],
            name: fields[1],
            leetcodeUsername: fields[2],
            leetcodeProfileLink: fields[3],
            week1Solved: this.parseNumber(fields[4]),
            week1Rank: fields[5] || '5,000,000',
            week2Solved: this.parseNumber(fields[6]),
            week2Rank: fields[7] || '5,000,000',
            week2Increment: this.parseNumber(fields[8]),
            week2RankImprovement: fields[9] || '0',
            week3Solved: this.parseNumber(fields[10]),
            week3Rank: fields[11] || '5,000,000',
            week3Increment: this.parseNumber(fields[12]),
            week4Solved: this.parseNumber(fields[14]),
            week5Solved: this.parseNumber(fields[16])
          };

          await this.createOrUpdateStudent(studentData);
          imported++;
          
        } catch (error) {
          const errorMsg = `Error processing student at line ${dataLines.indexOf(line) + 2}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return { imported, skipped, errors };
      
    } catch (error) {
      throw new Error(`Failed to import CSV: ${error}`);
    }
  }

  /**
   * Create or update student with historical data
   */
  private async createOrUpdateStudent(data: CSVStudentData): Promise<void> {
    try {
      // Check if student already exists
      const existingStudents = await storage.getAllStudents();
      let student = existingStudents.find(s => s.leetcodeUsername === data.leetcodeUsername);

      if (!student) {
        // Create new student
        student = await storage.createStudent({
          name: data.name,
          leetcodeUsername: data.leetcodeUsername,
          leetcodeProfileLink: data.leetcodeProfileLink
        });
      }

      // Create historical weekly trends data
      const currentDate = new Date();
      const weeks = [
        {
          weekStart: this.getWeekStart(currentDate, 3), // 3 weeks ago (Week 1)
          weekEnd: this.getWeekEnd(currentDate, 3),
          totalProblems: data.week1Solved,
          weeklyIncrement: data.week1Solved,
          ranking: this.parseRankToNumber(data.week1Rank)
        },
        {
          weekStart: this.getWeekStart(currentDate, 2), // 2 weeks ago (Week 2) 
          weekEnd: this.getWeekEnd(currentDate, 2),
          totalProblems: data.week2Solved,
          weeklyIncrement: data.week2Increment,
          ranking: this.parseRankToNumber(data.week2Rank)
        },
        {
          weekStart: this.getWeekStart(currentDate, 1), // 1 week ago (Week 3)
          weekEnd: this.getWeekEnd(currentDate, 1),
          totalProblems: data.week3Solved,
          weeklyIncrement: data.week3Increment,
          ranking: this.parseRankToNumber(data.week3Rank)
        }
      ];

      // Insert historical weekly trends
      for (const week of weeks) {
        // Check if trend already exists for this week
        const existingTrends = await storage.getWeeklyTrends(student.id, 1);
        const existingTrend = existingTrends.find(t => t.weekStart === week.weekStart);
        
        if (!existingTrend) {
          await storage.createWeeklyTrend({
            studentId: student.id,
            weekStart: week.weekStart,
            weekEnd: week.weekEnd,
            totalProblems: week.totalProblems,
            weeklyIncrement: week.weeklyIncrement,
            ranking: week.ranking
          });
        }
      }

      // Create historical daily progress for each week
      for (let weekOffset = 3; weekOffset >= 1; weekOffset--) {
        const weekStartDate = new Date(currentDate);
        weekStartDate.setDate(weekStartDate.getDate() - (weekOffset * 7));
        
        const weekData = weeks[3 - weekOffset];
        
        // Create daily entries for the week (simulated daily progress)
        for (let day = 0; day < 7; day++) {
          const date = new Date(weekStartDate);
          date.setDate(date.getDate() + day);
          
          const dateStr = date.toISOString().split('T')[0];
          const existingProgress = await storage.getDailyProgress(student.id, dateStr);
          
          if (!existingProgress) {
            // Distribute weekly increment across days (simulate daily activity)
            const dailyIncrement = day === 6 ? weekData.weeklyIncrement : Math.floor(weekData.weeklyIncrement / 7);
            const totalSolved = weekData.totalProblems - weekData.weeklyIncrement + (dailyIncrement * (day + 1));
            
            await storage.createDailyProgress({
              studentId: student.id,
              date: dateStr,
              totalSolved: Math.max(0, totalSolved),
              easySolved: Math.floor(totalSolved * 0.5),
              mediumSolved: Math.floor(totalSolved * 0.35),
              hardSolved: Math.floor(totalSolved * 0.15),
              dailyIncrement: dailyIncrement
            });
          }
        }
      }

    } catch (error) {
      throw new Error(`Failed to create/update student ${data.name}: ${error}`);
    }
  }

  /**
   * Parse rank string to number
   */
  private parseRankToNumber(rankStr: string): number {
    if (!rankStr || rankStr === '#VALUE!') return 5000000;
    
    const cleaned = rankStr.replace(/["',]/g, '');
    
    if (cleaned.includes('~') || cleaned.includes('+')) {
      return parseInt(cleaned.replace(/[~+]/g, '')) || 5000000;
    }
    
    return parseInt(cleaned) || 5000000;
  }

  /**
   * Get week start date (Monday) for given offset
   */
  private getWeekStart(currentDate: Date, weeksAgo: number): string {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - (weeksAgo * 7));
    
    // Get Monday of that week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    
    return date.toISOString().split('T')[0];
  }

  /**
   * Get week end date (Sunday) for given offset
   */
  private getWeekEnd(currentDate: Date, weeksAgo: number): string {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - (weeksAgo * 7));
    
    // Get Sunday of that week
    const day = date.getDay();
    const diff = date.getDate() - day + 7;
    date.setDate(diff);
    
    return date.toISOString().split('T')[0];
  }

  /**
   * Get analytics data combining historical and current data
   */
  async getAnalyticsData() {
    const students = await storage.getAllStudents();
    const analyticsData = [];

    for (const student of students) {
      // Get historical weekly trends
      const weeklyTrends = await storage.getWeeklyTrends(student.id, 4);
      
      // Get current stats (most recent daily progress)
      const recentProgress = await storage.getStudentDailyProgress(student.id, 1);
      const currentProgress = recentProgress[0];
      
      // Calculate improvement from Week 3 to current
      const week3Data = weeklyTrends.find(w => w.weekStart === this.getWeekStart(new Date(), 1));
      const currentSolved = currentProgress?.totalSolved || 0;
      const week3Solved = week3Data?.totalProblems || 0;
      
      const improvement = currentSolved - week3Solved;
      const improvementPercent = week3Solved > 0 ? ((improvement / week3Solved) * 100).toFixed(1) : '0.0';
      
      analyticsData.push({
        student,
        weeklyTrends: weeklyTrends.reverse(), // Chronological order
        currentSolved,
        week3Solved,
        improvement,
        improvementPercent: parseFloat(improvementPercent),
        status: improvement > 0 ? 'improved' : improvement < 0 ? 'declined' : 'same'
      });
    }

    return analyticsData;
  }
}

export const csvImportService = new CSVImportService();