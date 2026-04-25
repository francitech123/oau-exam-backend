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
            course: courseCode,
            timeLimit: 50,
            questions: questions.map(q => ({
                id: q._id,
                text: q.text,
                options: q.options,
                correctOption: q.correctOption,
                explanation: q.explanation
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start exam' });
    }
});

router.post('/session/submit', protect, async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        
        console.log('SUBMIT RECEIVED:', JSON.stringify({ courseCode, answerCount: answers ? Object.keys(answers).length : 0, timeSpent }));
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const timeSpentSec = Math.floor((timeSpent || 0) / 1000);
        
        // Always update these regardless of score calculation
        user.examsTaken = (user.examsTaken || 0) + 1;
        user.totalStudyTime = (user.totalStudyTime || 0) + timeSpentSec;
        
        // Calculate score
        let correctCount = 0;
        let totalQuestions = 40; // Default
        
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
            } catch(e) {
                console.log('Question lookup failed, using default');
            }
        }
        
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        
        console.log('SCORE:', { correctCount, totalQuestions, score });
        
        // Add to scores array
        if (!user.scores) user.scores = [];
        user.scores.push({
            course: courseCode || 'Unknown',
            score: correctCount,
            totalQuestions: totalQuestions,
            mode: 'exam',
            date: new Date()
        });
        
        // Streak
        const today = new Date().toDateString();
        const lastStr = user.lastActive ? new Date(user.lastActive).toDateString() : null;
        if (lastStr !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastStr === yesterday.toDateString()) {
                user.currentStreak = (user.currentStreak || 0) + 1;
                if (user.currentStreak > (user.longestStreak || 0)) user.longestStreak = user.currentStreak;
            } else {
                user.currentStreak = 1;
            }
            user.lastActive = new Date();
        }
        
        await user.save();
        console.log('USER SAVED - examsTaken:', user.examsTaken);
        
        // Notification
        try {
            await Notification.create({
                user: user._id,
                title: '📝 Exam Completed!',
                message: `You scored ${score}% in ${courseCode || 'exam'}. ${correctCount}/${totalQuestions} correct.`,
                type: score >= 70 ? 'success' : score >= 50 ? 'info' : 'warning'
            });
        } catch(e) {
            console.log('Notification failed:', e.message);
        }
        
        res.json({ success: true, score, correctCount, totalQuestions });
        
    } catch (error) {
        console.error('SUBMIT ERROR:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
