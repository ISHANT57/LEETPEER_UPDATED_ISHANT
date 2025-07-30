import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { leetCodeService } from "./services/leetcode";
import { schedulerService } from "./services/scheduler";
import { insertStudentSchema } from "@shared/schema";
import studentsData from "../attached_assets/students_1753783623487.json";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize students from JSON file
  app.post("/api/init-students", async (req, res) => {
    try {
      let importedCount = 0;
      
      for (const studentData of studentsData) {
        const existing = await storage.getStudentByUsername(studentData.leetcodeUsername);
        if (!existing) {
          await storage.createStudent({
            name: studentData.name,
            leetcodeUsername: studentData.leetcodeUsername,
            leetcodeProfileLink: studentData.leetcodeProfileLink,
          });
          importedCount++;
        }
      }
      
      res.json({ 
        message: `Imported ${importedCount} new students`,
        total: studentsData.length 
      });
    } catch (error) {
      console.error('Error importing students:', error);
      res.status(500).json({ error: "Failed to import students" });
    }
  });

  // Get all students
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Get student dashboard data
  app.get("/api/dashboard/student/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const student = await storage.getStudentByUsername(username);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      const dashboardData = await storage.getStudentDashboard(student.id);
      
      if (!dashboardData) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching student dashboard:', error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Get admin dashboard data
  app.get("/api/dashboard/admin", async (req, res) => {
    try {
      const dashboardData = await storage.getAdminDashboard();
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      res.status(500).json({ error: "Failed to fetch admin dashboard data" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Get all students with basic stats for directory
  app.get("/api/students/all", async (req, res) => {
    try {
      const adminData = await storage.getAdminDashboard();
      res.json(adminData.students);
    } catch (error) {
      console.error('Error fetching all students:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  // Get complete rankings for all students
  app.get("/api/rankings/all", async (req, res) => {
    try {
      const adminData = await storage.getAdminDashboard();
      
      // Sort students by total problems solved in descending order
      const rankedStudents = adminData.students
        .sort((a: any, b: any) => b.stats.totalSolved - a.stats.totalSolved)
        .map((student: any, index: number) => ({
          rank: index + 1,
          student: {
            id: student.id,
            name: student.name,
            leetcodeUsername: student.leetcodeUsername,
            leetcodeProfileLink: student.leetcodeProfileLink || `https://leetcode.com/u/${student.leetcodeUsername}/`
          },
          stats: student.stats,
          weeklyProgress: student.weeklyProgress,
          streak: student.streak,
          status: student.status,
          badges: student.badges?.length || 0
        }));

      res.json(rankedStudents);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      res.status(500).json({ error: 'Failed to fetch rankings' });
    }
  });

  // Sync single student
  app.post("/api/sync/student/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await leetCodeService.syncStudentData(id);
      
      if (success) {
        res.json({ message: "Student data synced successfully" });
      } else {
        res.status(400).json({ error: "Failed to sync student data" });
      }
    } catch (error) {
      console.error('Error syncing student:', error);
      res.status(500).json({ error: "Failed to sync student data" });
    }
  });

  // Sync all students
  app.post("/api/sync/all", async (req, res) => {
    try {
      const result = await schedulerService.manualSync();
      res.json(result);
    } catch (error) {
      console.error('Error syncing all students:', error);
      res.status(500).json({ error: "Failed to sync all students" });
    }
  });

  // Export CSV
  app.get("/api/export/csv", async (req, res) => {
    try {
      const adminData = await storage.getAdminDashboard();
      
      // Create CSV content
      const headers = ['Name', 'LeetCode Username', 'Total Solved', 'Weekly Progress', 'Streak', 'Status'];
      const csvContent = [
        headers.join(','),
        ...adminData.students.map((student: any) => [
          `"${student.name}"`,
          student.leetcodeUsername,
          student.stats.totalSolved,
          student.weeklyProgress,
          student.streak,
          `"${student.status}"`
        ].join(','))
      ].join('\n');
      
      const date = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="leetcode-progress-${date}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  // Get app settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Start the scheduler
  schedulerService.startDailySync();

  const httpServer = createServer(app);
  return httpServer;
}
