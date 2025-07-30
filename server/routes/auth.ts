import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { generateToken } from '../middleware/auth';
import { loginSchema } from '@shared/schema';

const router = Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: result.error.errors 
      });
    }

    const { username, password } = result.data;

    // Find user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login time
    await storage.updateUserLastLogin(user.id);

    // Generate JWT token
    const token = generateToken(user);

    // Get student info if user is a student
    let studentInfo = null;
    if (user.role === 'student' && user.studentId) {
      studentInfo = await storage.getStudent(user.studentId);
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        studentId: user.studentId,
        lastLoginAt: user.lastLoginAt
      },
      studentInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Token verification is handled by middleware
    // This endpoint would be used with authenticateToken middleware
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;