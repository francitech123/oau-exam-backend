const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('examsTaken testsTaken totalStudyTime currentStreak longestStreak scores achievements');
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Calculate AVERAGE from all scores
        let averageScore = 0;
        if (user.scores && user.scores.length > 0) {
            const sumOfPercentages = user.scores.reduce((sum, s) => {
                // Use stored percentage if available, otherwise calculate
                const pct = s.percentage || (s.totalQuestions > 0 ? Math.round((s.score / s.totalQuestions) * 100) : 0);
                return sum + pct;
            }, 0);
            averageScore = Math.round(sumOfPercentages / user.scores.length);
        }
        
        res.json({
            examsTaken: user.examsTaken || 0,
            testsTaken: user.testsTaken || 0,
            totalStudyTime: user.totalStudyTime || 0,
            currentStreak: user.currentStreak || 0,
            longestStreak: user.longestStreak || 0,
            averageScore: averageScore,  // ← This is what dashboard shows
            scores: user.scores || [],
            achievements: user.achievements || []
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

router.put('/profile', protect, async (req, res) => {
    try {
        const { fullName, faculty, department, level, profilePicture } = req.body;
        if (fullName) req.user.fullName = fullName;
        if (faculty) req.user.faculty = faculty;
        if (department) req.user.department = department;
        if (level) req.user.level = level;
        if (profilePicture) req.user.profilePicture = profilePicture;
        await req.user.save();
        res.json({ success: true, user: req.user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
