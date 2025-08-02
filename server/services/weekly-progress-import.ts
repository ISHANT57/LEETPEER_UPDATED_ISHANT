import fs from 'fs/promises';
import path from 'path';
import { storage } from '../storage';
import { type InsertWeeklyProgressData } from '@shared/schema';

interface CSVWeeklyProgressRow {
  Name: string;
  'LeetCode Username': string;
  LeetcodeProfileLink: string;
  WEEK1: string;
  WEEK2: string;
  WEEK3: string;
  WEEK4: string;
}

interface WeeklyProgressStats {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export class WeeklyProgressImportService {
  async importWeeklyProgressFromCSV(csvFilePath: string): Promise<WeeklyProgressStats> {
    const stats: WeeklyProgressStats = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      // Read and parse CSV file
      const csvContent = await fs.readFile(csvFilePath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Skip header line and process data lines
      const dataLines = lines.slice(1);
      console.log(`Processing ${dataLines.length} students from weekly progress CSV...`);

      // Process each student record
      for (const line of dataLines) {
        try {
          const record = this.parseCSVLine(line);
          await this.processStudentWeeklyProgress(record, stats);
        } catch (error) {
          const errorMsg = `Error processing line: ${error}`;
          console.error(errorMsg);
          stats.errors.push(errorMsg);
        }
      }

      console.log(`Weekly progress import completed: ${stats.imported} imported, ${stats.updated} updated, ${stats.skipped} skipped`);
      return stats;

    } catch (error) {
      console.error('Error importing weekly progress CSV:', error);
      throw new Error(`Failed to import weekly progress CSV: ${error}`);
    }
  }

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
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }

  private async processStudentWeeklyProgress(record: string[], stats: WeeklyProgressStats): Promise<void> {
    // CSV format: Name,LeetCode Username,LeetcodeProfileLink,WEEK1,WEEK2,WEEK3,WEEK4
    if (record.length < 7) {
      stats.skipped++;
      return;
    }

    const [name, leetcodeUsername, profileLink, week1Str, week2Str, week3Str, week4Str] = record;
    
    if (!leetcodeUsername?.trim()) {
      stats.skipped++;
      return;
    }
    
    if (!leetcodeUsername) {
      stats.skipped++;
      return;
    }

    // Find student by LeetCode username
    const student = await storage.getStudentByUsername(leetcodeUsername);
    if (!student) {
      stats.errors.push(`Student not found: ${leetcodeUsername}`);
      stats.skipped++;
      return;
    }

    // Parse weekly scores
    const week1Score = this.parseScore(week1Str);
    const week2Score = this.parseScore(week2Str);
    const week3Score = this.parseScore(week3Str);
    const week4Score = this.parseScore(week4Str);

    // Calculate progress increments
    const week2Progress = week2Score - week1Score;
    const week3Progress = week3Score - week2Score;
    const week4Progress = week4Score - week3Score;

    // Calculate total score and average weekly growth
    const totalScore = week1Score + week2Score + week3Score + week4Score;
    const validWeeks = [week2Progress, week3Progress, week4Progress].filter(p => !isNaN(p));
    const averageWeeklyGrowth = validWeeks.length > 0 
      ? Math.round(validWeeks.reduce((sum, p) => sum + p, 0) / validWeeks.length)
      : 0;

    const weeklyProgressData: InsertWeeklyProgressData = {
      studentId: student.id,
      week1Score,
      week2Score,
      week3Score,
      week4Score,
      week2Progress,
      week3Progress,
      week4Progress,
      totalScore,
      averageWeeklyGrowth
    };

    // Check if weekly progress data already exists for this student
    const existingData = await storage.getWeeklyProgressData(student.id);
    
    if (existingData) {
      // Update existing data
      await storage.updateWeeklyProgressData(student.id, weeklyProgressData);
      stats.updated++;
    } else {
      // Create new data
      await storage.createWeeklyProgressData(weeklyProgressData);
      stats.imported++;
    }
  }

  private parseScore(scoreStr: string): number {
    if (!scoreStr || scoreStr.trim() === '') {
      return 0;
    }
    
    const parsed = parseInt(scoreStr.trim(), 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Helper method to get enhanced weekly progress data with student details
  async getEnhancedWeeklyProgressData() {
    const allProgressData = await storage.getAllWeeklyProgressData();
    const allStudents = await storage.getAllStudents();
    
    return allProgressData.map(progressData => {
      const student = allStudents.find(s => s.id === progressData.studentId);
      
      return {
        student: student ? {
          name: student.name,
          leetcodeUsername: student.leetcodeUsername,
          leetcodeProfileLink: student.leetcodeProfileLink
        } : null,
        weeklyData: {
          week1: progressData.week1Score,
          week2: progressData.week2Score,
          week3: progressData.week3Score,
          week4: progressData.week4Score
        },
        progressIncrements: {
          week2Progress: progressData.week2Progress,
          week3Progress: progressData.week3Progress,
          week4Progress: progressData.week4Progress
        },
        summary: {
          totalScore: progressData.totalScore,
          averageWeeklyGrowth: progressData.averageWeeklyGrowth
        }
      };
    }).filter(item => item.student !== null);
  }

  // Helper method to get specific student's weekly progress
  async getStudentWeeklyProgress(leetcodeUsername: string) {
    const student = await storage.getStudentByUsername(leetcodeUsername);
    if (!student) {
      return null;
    }

    const progressData = await storage.getWeeklyProgressData(student.id);
    if (!progressData) {
      return null;
    }

    return {
      student: {
        name: student.name,
        leetcodeUsername: student.leetcodeUsername,
        leetcodeProfileLink: student.leetcodeProfileLink
      },
      weeklyData: {
        week1: progressData.week1Score,
        week2: progressData.week2Score,
        week3: progressData.week3Score,
        week4: progressData.week4Score
      },
      progressIncrements: {
        week2Progress: progressData.week2Progress,
        week3Progress: progressData.week3Progress,
        week4Progress: progressData.week4Progress
      },
      summary: {
        totalScore: progressData.totalScore,
        averageWeeklyGrowth: progressData.averageWeeklyGrowth
      }
    };
  }
}

export const weeklyProgressImportService = new WeeklyProgressImportService();