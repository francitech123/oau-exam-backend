const express = require('express');
const User = require('../models/User');
const router = express.Router();

// ==================== GET LEADERBOARD ====================
router.get('/', async (req, res) => {
    try {
        console.log('📊 Fetching leaderboard...');
        
        // Find all users who have at least one score
        const users = await User.find({ 
            'scores.0': { $exists: true }
        })
        .select('fullName username faculty department level examsTaken testsTaken totalStudyTime scores createdAt')
        .lean();

        console.log(`📊 Found ${users.length} users with scores`);

        // Calculate average score for each user
        const leaderboard = users.map(user => {
            let totalPercentage = 0;
            let scoreCount = 0;
            
            if (user.scores && user.scores.length > 0) {
                user.scores.forEach(s => {
                    // Calculate percentage for this score
                    let pct = 0;
                    if (s.percentage) {
                        pct = s.percentage;
                    } else if (s.totalQuestions > 0) {
                        pct = Math.round((s.score / s.totalQuestions) * 100);
                    }
                    totalPercentage += pct;
                    scoreCount++;
                });
            }
            
            const averageScore = scoreCount > 0 ? Math.round(totalPercentage / scoreCount) : 0;
            
            // Create display name (first 2 letters + ****)
            const firstName = (user.fullName || 'User').split(' ')[0];
            const displayName = firstName.substring(0, 2).toLowerCase() + '****';
            
            return {
                id: user._id,
                displayName: displayName,
                fullName: user.fullName,
                faculty: user.faculty || 'N/A',
                department: user.department || 'N/A',
                level: user.level || '100',
                examsTaken: user.examsTaken || 0,
                testsTaken: user.testsTaken || 0,
                totalStudyTime: user.totalStudyTime || 0,
                averageScore: averageScore,
                joinedDate: user.createdAt
            };
        })
        // Only show users who have taken at least 1 exam
        .filter(user => user.examsTaken > 0)
        // Sort by average score (highest first)
        .sort((a, b) => b.averageScore - a.averageScore)
        // Top 50
        .slice(0, 50);

        console.log(`📊 Leaderboard: ${leaderboard.length} students ranked`);
        if (leaderboard.length > 0) {
            console.log(`📊 Top score: ${leaderboard[0].averageScore}% by ${leaderboard[0].displayName}`);
        }

        res.json({ 
            success: true,
            leaderboard,
            total: leaderboard.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard', message: error.message });
    }
});

// ==================== GET USER RANK ====================
router.get('/my-rank', async (req, res) => {
    try {
        // This would need auth, but for public leaderboard we skip it
        const users = await User.find({ 'scores.0': { $exists: true } })
            .select('fullName examsTaken scores')
            .lean();

        const ranked = users.map(user => {
            let totalPct = 0, count = 0;
            (user.scores || []).forEach(s => {
                const pct = s.percentage || (s.totalQuestions > 0 ? Math.round((s.score / s.totalQuestions) * 100) : 0);
                totalPct += pct; count++;
            });
            return {
                id: user._id,
                name: user.fullName,
                examsTaken: user.examsTaken,
                averageScore: count > 0 ? Math.round(totalPct / count) : 0
            };
        })
        .filter(u => u.examsTaken > 0)
        .sort((a, b) => b.averageScore - a.averageScore);

        res.json({ totalRanked: ranked.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get rank' });
    }
});

module.exports = router;
