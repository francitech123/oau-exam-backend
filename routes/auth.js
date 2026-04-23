const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { fullName, username, email, password, faculty, department, level, securityQuestion, securityAnswer } = req.body;

        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const user = await User.create({
            fullName,
            username: username.toLowerCase(),
            email,
            password,
            faculty,
            department,
            level,
            securityQuestion,
            securityAnswer: securityAnswer.toLowerCase(),
            lastActive: new Date(),
            currentStreak: 1
        });

        await Notification.create({
            user: user._id,
            title: '🎉 Welcome to OAU Exam Plug!',
            message: `Welcome ${fullName.split(' ')[0]}! Start practicing for your exams today. 14 faculties available.`,
            type: 'success'
        });

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
                achievements: user.achievements
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

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
                examsTaken: user.examsTaken,
                testsTaken: user.testsTaken,
                totalStudyTime: user.totalStudyTime,
                currentStreak: user.currentStreak,
                achievements: user.achievements
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    res.json({ user: req.user });
});

// Reset password
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

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ error: 'Password reset failed' });
    }
});

// Change password
router.post('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const isMatch = await req.user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        req.user.password = newPassword;
        await req.user.save();

        res.json({ success: true, message: 'Password changed' });
    } catch (error) {
        res.status(500).json({ error: 'Password change failed' });
    }
});

module.exports = router;
