const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ==================== GENERATE JWT TOKEN ====================
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
    try {
        const { 
            fullName, username, email, password, 
            faculty, department, level, 
            securityQuestion, securityAnswer 
        } = req.body;

        // Check if username exists
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create user
        const user = await User.create({
            fullName,
            username: username.toLowerCase(),
            email: email || undefined,
            password,
            faculty,
            department,
            level: level || '100',
            securityQuestion,
            securityAnswer: securityAnswer.toLowerCase(),
            lastActive: new Date(),
            currentStreak: 1,
            longestStreak: 1,
            examsTaken: 0,
            testsTaken: 0,
            totalStudyTime: 0,
            scores: [],
            achievements: []
        });

        // Create welcome notification
        await Notification.create({
            user: user._id,
            title: '🎉 Welcome to OAU Exam Plug!',
            message: `Welcome ${fullName.split(' ')[0]}! Start practicing for your exams today. 14 faculties available.`,
            type: 'success'
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                faculty: user.faculty,
                department: user.department,
                level: user.level,
                profilePicture: user.profilePicture,
                examsTaken: user.examsTaken,
                testsTaken: user.testsTaken,
                totalStudyTime: user.totalStudyTime,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                scores: user.scores,
                achievements: user.achievements,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                faculty: user.faculty,
                department: user.department,
                level: user.level,
                profilePicture: user.profilePicture,
                examsTaken: user.examsTaken || 0,
                testsTaken: user.testsTaken || 0,
                totalStudyTime: user.totalStudyTime || 0,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                scores: user.scores || [],
                achievements: user.achievements || [],
                isAdmin: user.isAdmin || false,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ==================== GET CURRENT USER (WITH SCORES) ====================
router.get('/me', protect, async (req, res) => {
    try {
        // Fetch fresh user data from database
        const user = await User.findById(req.user._id)
            .select('-password -securityAnswer');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate average score for quick access
        let averageScore = 0;
        if (user.scores && user.scores.length > 0) {
            const total = user.scores.reduce((sum, s) => {
                if (s.totalQuestions > 0) {
                    return sum + Math.round((s.score / s.totalQuestions) * 100);
                }
                return sum;
            }, 0);
            averageScore = Math.round(total / user.scores.length);
        }

        res.json({
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                faculty: user.faculty,
                department: user.department,
                level: user.level,
                profilePicture: user.profilePicture,
                isAdmin: user.isAdmin,
                examsTaken: user.examsTaken || 0,
                testsTaken: user.testsTaken || 0,
                totalStudyTime: user.totalStudyTime || 0,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                averageScore: averageScore,
                scores: user.scores || [],
                achievements: user.achievements || [],
                lastActive: user.lastActive,
                createdAt: user.createdAt,
                preferences: user.preferences || {}
            }
        });

    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req, res) => {
    try {
        const { username, securityQuestion, securityAnswer } = req.body;

        const user = await User.findOne({
            username: username.toLowerCase(),
            securityQuestion,
            securityAnswer: securityAnswer.toLowerCase()
        });

        if (!user) {
            return res.status(400).json({ error: 'Information does not match our records' });
        }

        res.json({
            success: true,
            message: 'Identity verified',
            userId: user._id
        });

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ error: 'Request failed' });
    }
});

// ==================== RESET PASSWORD ====================
router.post('/reset-password', async (req, res) => {
    try {
        const { username, securityQuestion, securityAnswer, newPassword } = req.body;

        const user = await User.findOne({
            username: username.toLowerCase(),
            securityQuestion,
            securityAnswer: securityAnswer.toLowerCase()
        });

        if (!user) {
            return res.status(400).json({ error: 'Information does not match' });
        }

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password reset successful' });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

// ==================== CHANGE PASSWORD (AUTHENTICATED) ====================
router.post('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const isMatch = await req.user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        req.user.password = newPassword;
        await req.user.save();

        res.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({ error: 'Password change failed' });
    }
});

module.exports = router;
