const express = require('express');
const Question = require('../models/Question');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/session/start', protect, async (req, res) => {
    try {
        const { courseCode } = req.body;
        const questions = await Question.aggregate([
            { $match: { courseCode, mode: 'exam', isActive: true } },
            { $sample: { size: 40 } }
        ]);
        if (questions.length === 0) {
            const sample = Array(40).fill(null).map((_, i) => ({
                _id: `sample_${i}`,
                text: `Sample question ${i + 1} for ${courseCode}`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctOption: 0,
                explanation: 'Real questions coming soon!'
            }));
            return res.json({ course: courseCode, timeLimit: 50, questions: sample });
        }
        res.json({
            course: courseCode, timeLimit: 50,
            questions: questions.map(q => ({
                id: q._id, text: q.text, options: q.options,
                correctOption: q.correctOption, explanation: q.explanation
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start exam' });
    }
});

router.post('/session/submit', protect, async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const timeSpentSec = Math.floor((timeSpent || 0) / 1000);
        
        // Calculate this exam's score
        let correctCount = 0;
        let totalQuestions = 0;
        
        if (answers && Object.keys(answers).length > 0) {
            totalQuestions = Object.keys(answers).length;
            try {
                const questions = await Question.find({ courseCode, mode: 'exam' }).limit(totalQuestions);
                if (questions.length > 0) {
                    questions.forEach((q, i) => {
                        if (answers[i] !== undefined && answers[i] !== null && answers[i] === q.correctOption) {
                            correctCount++;
                        }
                    });
                    totalQuestions = questions.length;
                }
            } catch(e) {}
        }
        
        // THIS IS THE EXACT SCORE FOR THIS EXAM
        const exactScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        
        // Save this exam's score to the scores array
        user.examsTaken = (user.examsTaken || 0) + 1;
        user.totalStudyTime = (user.totalStudyTime || 0) + timeSpentSec;
        
        if (!user.scores) user.scores = [];
        user.scores.push({
            course: courseCode || 'Unknown',
            score: correctCount,
            totalQuestions: totalQuestions,
            percentage: exactScore,  // Store the calculated percentage
            mode: 'exam',
            date: new Date()
        });
        
        // Calculate AVERAGE from all scores
        let avgScore = 0;
        if (user.scores.length > 0) {
            const sumOfPercentages = user.scores.reduce((sum, s) => {
                return sum + (s.percentage || (s.totalQuestions > 0 ? Math.round((s.score / s.totalQuestions) * 100) : 0));
            }, 0);
            avgScore = Math.round(sumOfPercentages / user.scores.length);
        }
        
        // Update streak
        const today = new Date().toDateString();
        const lastStr = user.lastActive ? new Date(user.lastActive).toDateString() : null;
        if (lastStr !== today) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            if (lastStr === yesterday.toDateString()) {
                user.currentStreak = (user.currentStreak || 0) + 1;
                if (user.currentStreak > (user.longestStreak || 0)) user.longestStreak = user.currentStreak;
            } else {
                user.currentStreak = 1;
            }
            user.lastActive = new Date();
        }
        
        await user.save();
        
        // Notification shows EXACT score
        await Notification.create({
            user: user._id,
            title: '📝 Exam Completed!',
            message: `You scored ${exactScore}% in ${courseCode || 'exam'}. Your overall average is now ${avgScore}%.`,
            type: exactScore >= 70 ? 'success' : exactScore >= 50 ? 'info' : 'warning'
        });
        
        res.json({
            success: true,
            exactScore: exactScore,      // This exam's score
            averageScore: avgScore,      // Overall average
            correctCount,
            totalQuestions
        });
        
    } catch (error) {
        console.error('Submit error:', error);
        res.status(500).json({ error: 'Failed to submit exam' });
    }
});

module.exports = router;
