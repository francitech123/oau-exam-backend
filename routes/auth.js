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

        // Validate required fields
        if (!fullName || !username || !password || !faculty || !department || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if username exists
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if email exists (if provided)
        if (email) {
            const existingEmail = await User.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already registered' });
            }
        }

        // Create user
        const user = await User.create({
            fullName,
            username: username.toLowerCase(),
            email: email ? email.toLowerCase() : undefined,
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
            achievements: [],
            isAdmin: false
        });

        // Create welcome notification
        try {
            await Notification.create({
                user: user._id,
                title: '🎉 Welcome to OAU Exam Plug!',
                message: `Welcome ${fullName.split(' ')[0]}! Start practicing for your exams today. 14 faculties with 100 level courses available.`,
                type: 'success'
            });
        } catch (notifError) {
            console.log('Welcome notification failed:', notifError.message);
        }

        // Generate token
        const token = generateToken(user._id);

        console.log('✅ New user registered:', user.username);

        res.status(201).json({
            success: true,
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
                examsTaken: 0,
                testsTaken: 0,
                totalStudyTime: 0,
                currentStreak: 1,
                longestStreak: 1,
                averageScore: 0,
                scores: [],
                achievements: [],
                isAdmin: false,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Register error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Please provide username and password' });
        }

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

        // Calculate average score
        let averageScore = 0;
        if (user.scores && user.scores.length > 0) {
            const sumOfPercentages = user.scores.reduce((sum, s) => {
                const pct = s.percentage || 
                    (s.totalQuestions > 0 ? Math.round((s.score / s.totalQuestions) * 100) : 0);
                return sum + pct;
            }, 0);
            averageScore = Math.round(sumOfPercentages / user.scores.length);
        }

        // Generate token
        const token = generateToken(user._id);

        console.log('✅ User logged in:', user.username);

        res.json({
            success: true,
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
                averageScore: averageScore,
                scores: user.scores || [],
                achievements: user.achievements || [],
                isAdmin: user.isAdmin || false,
                preferences: user.preferences || {},
                createdAt: user.createdAt,
                lastActive: user.lastActive
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ==================== GET CURRENT USER (WITH AVERAGE SCORE) ====================
router.get('/me', protect, async (req, res) => {
    try {
        // Fetch fresh user data from database (exclude sensitive fields)
        const user = await User.findById(req.user._id)
            .select('-password -securityAnswer');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate average score from all exam scores
        let averageScore = 0;
        if (user.scores && user.scores.length > 0) {
            const sumOfPercentages = user.scores.reduce((sum, s) => {
                // Use stored percentage if available, otherwise calculate from score/total
                const pct = s.percentage || 
                    (s.totalQuestions > 0 ? Math.round((s.score / s.totalQuestions) * 100) : 0);
                return sum + pct;
            }, 0);
            averageScore = Math.round(sumOfPercentages / user.scores.length);
        }

        console.log('📊 /me - Average score calculated:', {
            userId: user._id,
            scoresCount: user.scores?.length || 0,
            averageScore: averageScore
        });

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                faculty: user.faculty,
                department: user.department,
                level: user.level,
                profilePicture: user.profilePicture,
                isAdmin: user.isAdmin || false,
                examsTaken: user.examsTaken || 0,
                testsTaken: user.testsTaken || 0,
                totalStudyTime: user.totalStudyTime || 0,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                averageScore: averageScore,
                scores: user.scores || [],
                achievements: user.achievements || [],
                preferences: user.preferences || {},
                lastActive: user.lastActive,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Get user (/me) error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req, res) => {
    try {
        const { username, securityQuestion, securityAnswer } = req.body;

        if (!username || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        const user = await User.findOne({
            username: username.toLowerCase(),
            securityQuestion: securityQuestion
        });

        if (!user) {
            return res.status(400).json({ error: 'No account found with these details' });
        }

        // Compare security answer (case insensitive)
        const isMatch = user.securityAnswer.toLowerCase() === securityAnswer.toLowerCase();
        if (!isMatch) {
            return res.status(400).json({ error: 'Security answer does not match' });
        }

        res.json({
            success: true,
            message: 'Identity verified. You can now reset your password.',
            userId: user._id
        });

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ error: 'Request failed. Please try again.' });
    }
});

// ==================== RESET PASSWORD (WITHOUT LOGIN) ====================
router.post('/reset-password', async (req, res) => {
    try {
        const { username, securityQuestion, securityAnswer, newPassword } = req.body;

        if (!username || !securityQuestion || !securityAnswer || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const user = await User.findOne({
            username: username.toLowerCase(),
            securityQuestion: securityQuestion
        });

        if (!user) {
            return res.status(400).json({ error: 'Information does not match our records' });
        }

        // Verify security answer
        const isMatch = user.securityAnswer.toLowerCase() === securityAnswer.toLowerCase();
        if (!isMatch) {
            return res.status(400).json({ error: 'Security answer is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        console.log('✅ Password reset for:', user.username);

        res.json({ 
            success: true, 
            message: 'Password reset successful! You can now login with your new password.' 
        });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({ error: 'Password reset failed. Please try again.' });
    }
});

// ==================== CHANGE PASSWORD (AUTHENTICATED) ====================
router.post('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Please provide current and new password' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        // Verify current password
        const isMatch = await req.user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Update password
        req.user.password = newPassword;
        await req.user.save();

        console.log('✅ Password changed for:', req.user.username);

        res.json({ 
            success: true, 
            message: 'Password changed successfully!' 
        });

    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({ error: 'Password change failed. Please try again.' });
    }
});

// ==================== UPDATE PREFERENCES ====================
router.put('/preferences', protect, async (req, res) => {
    try {
        const { darkMode, emailNotifications, pushNotifications, studyReminderTime } = req.body;

        if (!req.user.preferences) {
            req.user.preferences = {};
        }

        if (darkMode !== undefined) req.user.preferences.darkMode = darkMode;
        if (emailNotifications !== undefined) req.user.preferences.emailNotifications = emailNotifications;
        if (pushNotifications !== undefined) req.user.preferences.pushNotifications = pushNotifications;
        if (studyReminderTime) req.user.preferences.studyReminderTime = studyReminderTime;

        await req.user.save();

        res.json({ 
            success: true, 
            preferences: req.user.preferences 
        });

    } catch (error) {
        console.error('❌ Update preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// ==================== DELETE ACCOUNT ====================
router.delete('/account', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // Delete user's notifications
        await Notification.deleteMany({ user: userId });

        // Delete user
        await User.findByIdAndDelete(userId);

        console.log('🗑️ Account deleted:', req.user.username);

        res.json({ 
            success: true, 
            message: 'Account deleted successfully. We\'re sad to see you go!' 
        });

    } catch (error) {
        console.error('❌ Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
