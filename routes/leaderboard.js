const express = require('express');
const User = require('../models/User');
const router = express.Router();

// GET /api/leaderboard - Get leaderboard data (public, no auth required)
router.get('/', async (req, res) => {
    try {
        // Find all users who have taken at least one exam or test
        const users = await User.find({
            $or: [
                { examsTaken: { $gt: 0 } },
                { testsTaken: { $gt: 0 } }
            ]
        })
        .select('fullName username faculty department level examsTaken testsTaken totalStudyTime scores createdAt')
        .lean();

        // Process and format leaderboard data
        const leaderboard = users.map(user => {
            // Calculate average score from all exam/test scores
            let avgScore = 0;
            if (user.scores && user.scores.length > 0) {
                const totalPercentage = user.scores.reduce((sum, score) => {
                    return sum + (score.score / score.totalQuestions * 100);
                }, 0);
                avgScore = Math.round(totalPercentage / user.scores.length);
            }

            // Get first 2 letters of first name for privacy
            const firstName = user.fullName ? user.fullName.split(' ')[0] : 'User';
            const displayName = firstName.substring(0, 2) + '****';

            // Format joined date
            const joinedDate = user.createdAt || new Date();

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
                averageScore: avgScore,
                joinedDate: joinedDate
            };
        })
        // Filter out users with 0 average score
        .filter(user => user.averageScore > 0 || user.examsTaken > 0)
        // Sort by average score (highest first), then by exams taken
        .sort((a, b) => {
            if (b.averageScore !== a.averageScore) {
                return b.averageScore - a.averageScore;
            }
            return b.examsTaken - a.examsTaken;
        })
        // Limit to top 50
        .slice(0, 50);

        res.json({
            success: true,
            leaderboard: leaderboard,
            total: leaderboard.length
        });

    } catch (error) {
        console.error('❌ Leaderboard error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch leaderboard data' 
        });
    }
});

// GET /api/leaderboard/stats - Get leaderboard statistics
router.get('/stats', async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({
            $or: [
                { examsTaken: { $gt: 0 } },
                { testsTaken: { $gt: 0 } }
            ]
        });

        const allUsers = await User.find({
            $or: [
                { examsTaken: { $gt: 0 } },
                { testsTaken: { $gt: 0 } }
            ]
        }).select('examsTaken testsTaken scores').lean();

        const totalExams = allUsers.reduce((sum, u) => sum + (u.examsTaken || 0) + (u.testsTaken || 0), 0);
        
        let platformAverage = 0;
        if (allUsers.length > 0) {
            const allScores = [];
            allUsers.forEach(u => {
                if (u.scores) {
                    u.scores.forEach(s => {
                        allScores.push((s.score / s.totalQuestions) * 100);
                    });
                }
            });
            if (allScores.length > 0) {
                platformAverage = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
            }
        }

        res.json({
            success: true,
            stats: {
                totalStudents,
                totalExams,
                platformAverage
            }
        });

    } catch (error) {
        console.error('❌ Leaderboard stats error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch stats' 
        });
    }
});

// GET /api/leaderboard/top/:count - Get top N students
router.get('/top/:count', async (req, res) => {
    try {
        const count = parseInt(req.params.count) || 3;
        
        const users = await User.find({
            $or: [
                { examsTaken: { $gt: 0 } },
                { testsTaken: { $gt: 0 } }
            ]
        })
        .select('fullName faculty department level examsTaken scores')
        .lean();

        const leaderboard = users.map(user => {
            let avgScore = 0;
            if (user.scores && user.scores.length > 0) {
                const totalPercentage = user.scores.reduce((sum, score) => {
                    return sum + (score.score / score.totalQuestions * 100);
                }, 0);
                avgScore = Math.round(totalPercentage / user.scores.length);
            }

            const firstName = user.fullName ? user.fullName.split(' ')[0] : 'User';
            const displayName = firstName.substring(0, 2) + '****';

            return {
                displayName,
                department: user.department || 'N/A',
                level: user.level || '100',
                examsTaken: user.examsTaken || 0,
                averageScore: avgScore
            };
        })
        .filter(u => u.averageScore > 0)
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, count);

        res.json({
            success: true,
            topStudents: leaderboard
        });

    } catch (error) {
        console.error('❌ Top students error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch top students' 
        });
    }
});

module.exports = router;
