const express = require('express');
const User = require('../models/User');
const router = express.Router();

// ==================== GET LEADERBOARD ====================
router.get('/', async (req, res) => {
    try {
        // Find all users who have taken at least one exam
        const users = await User.find({ 
            'scores.0': { $exists: true }  // Only users with scores
        })
        .select('fullName username faculty department level examsTaken testsTaken scores createdAt')
        .lean();

        // Calculate average score for each user
        const leaderboard = users.map(user => {
            let avgScore = 0;
            
            if (user.scores && user.scores.length > 0) {
                // Sum all percentage scores
                const sumOfPercentages = user.scores.reduce((sum, s) => {
                    // Use stored percentage if available, otherwise calculate
                    const pct = s.percentage || 
                        (s.totalQuestions > 0 ? Math.round((s.score / s.totalQuestions) * 100) : 0);
                    return sum + pct;
                }, 0);
                
                // Calculate average
                avgScore = Math.round(sumOfPercentages / user.scores.length);
            }
            
            // Create display name (first 2 letters + ****)
            const firstName = (user.fullName || 'User').split(' ')[0];
            const displayName = firstName.substring(0, 2) + '****';
            
            return {
                id: user._id,
                displayName: displayName,
                fullName: user.fullName,
                username: user.username,
                faculty: user.faculty || '',
                department: user.department || '',
                level: user.level || '100',
                examsTaken: user.examsTaken || 0,
                testsTaken: user.testsTaken || 0,
                averageScore: avgScore,
                joinedDate: user.createdAt
            };
        })
        // Filter out users with no exams
        .filter(user => user.examsTaken > 0)
        // Sort by average score (highest first)
        .sort((a, b) => b.averageScore - a.averageScore)
        // Top 50 only
        .slice(0, 50);

        console.log(`📊 Leaderboard: ${leaderboard.length} students loaded`);

        res.json({ 
            leaderboard,
            total: leaderboard.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// ==================== GET TOP 3 ====================
router.get('/top', async (req, res) => {
    try {
        const users = await User.find({ 'scores.0': { $exists: true } })
            .select('fullName faculty department level examsTaken scores')
            .lean();

        const top3 = users.map(user => {
            let avgScore = 0;
            if (user.scores && user.scores.length > 0) {
                const sum = user.scores.reduce((acc, s) => {
                    const pct = s.percentage || (s.totalQuestions > 0 ? Math.round((s.score / s.totalQuestions) * 100) : 0);
                    return acc + pct;
                }, 0);
                avgScore = Math.round(sum / user.scores.length);
            }

            const firstName = (user.fullName || 'User').split(' ')[0];
            return {
                displayName: firstName.substring(0, 2) + '****',
                faculty: user.faculty,
                department: user.department,
                level: user.level,
                examsTaken: user.examsTaken,
                averageScore: avgScore
            };
        })
        .filter(u => u.examsTaken > 0)
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 3);

        res.json({ top3 });
    } catch (error) {
        console.error('❌ Top 3 error:', error);
        res.status(500).json({ error: 'Failed to fetch top 3' });
    }
});

module.exports = router;
