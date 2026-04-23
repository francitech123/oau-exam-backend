const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Update profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { fullName, faculty, department, level, profilePicture } = req.body;
        
        if (fullName) req.user.fullName = fullName;
        if (faculty) req.user.faculty = faculty;
        if (department) req.user.department = department;
        if (level) req.user.level = level;
        if (profilePicture) req.user.profilePicture = profilePicture;
        
        await req.user.save();

        res.json({
            success: true,
            user: {
                fullName: req.user.fullName,
                faculty: req.user.faculty,
                department: req.user.department,
                level: req.user.level,
                profilePicture: req.user.profilePicture
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get user stats
router.get('/stats', protect, async (req, res) => {
    try {
        const averageScore = req.user.getAverageScore();
        
        res.json({
            examsTaken: req.user.examsTaken,
            testsTaken: req.user.testsTaken,
            totalStudyTime: req.user.totalStudyTime,
            currentStreak: req.user.currentStreak,
            longestStreak: req.user.longestStreak,
            averageScore,
            achievements: req.user.achievements
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
