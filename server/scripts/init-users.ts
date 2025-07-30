import bcrypt from 'bcryptjs';
import { storage } from '../storage';

export async function initializeUsers() {
  try {
    console.log('Initializing user accounts...');

    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername('admin');
    if (!existingAdmin) {
      // Create admin user
      const hashedAdminPassword = await bcrypt.hash('password', 10);
      await storage.createUser({
        username: 'admin',
        password: hashedAdminPassword,
        role: 'admin',
        isActive: true
      });
      console.log('✓ Admin user created (username: admin, password: password)');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Get all students and create user accounts for them
    const students = await storage.getAllStudents();
    let createdCount = 0;

    for (const student of students) {
      const existingUser = await storage.getUserByUsername(student.leetcodeUsername);
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('12345678', 10);
        await storage.createUser({
          username: student.leetcodeUsername,
          password: hashedPassword,
          role: 'student',
          studentId: student.id,
          isActive: true
        });
        createdCount++;
      }
    }

    console.log(`✓ Created ${createdCount} student user accounts`);
    console.log(`✓ Total students: ${students.length}`);
    console.log('All students use password: 12345678');
    console.log('User initialization completed successfully!');

  } catch (error) {
    console.error('Error initializing users:', error);
    throw error;
  }
}