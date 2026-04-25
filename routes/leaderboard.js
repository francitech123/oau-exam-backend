const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const users = await User.find({ 'scores.0': { $exists: true } })
            .select('fullName username faculty department level examsTaken scores createdAt')
            .lean();

        const leaderboard = users.map(user => {
            // Calculate AVERAGE from all scores
            let avgScore = 0;
            if (user.scores && user.scores.length > 0) {
                const sumOfPercentages = user.scores.reduce((sum, s) => {
                    const pct = s.percentage || (s.totalQuestions > 0 ? Math.round((s.score / s.totalQuestions) * 100) : 0);
                    return sum + pct;
                }, 0);
                avgScore = Math.round(sumOfPercentages / user.scores.length);
            }
            
            const firstName = (user.fullName || 'User').split(' ')[0];
            const displayName = firstName.substring(0, 2) + '****';
            
            return {
                id: user._id,
                displayName: displayName,
                fullName: user.fullName,
                faculty: user.faculty,
                department: user.department,
                level: user.level,
                examsTaken: user.examsTaken || 0,
                averageScore: avgScore,  // ← Average, not individual exam score
                joinedDate: user.createdAt
            };
        })
        .filter(user => user.examsTaken > 0)
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 50);

        res.json({ leaderboard });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

module.exports = router;
