const express = require('express');
const Question = require('../models/Question');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ==================== START EXAM SESSION ====================
router.post('/session/start', protect, async (req, res) => {
    try {
        const { courseCode } = req.body;
        console.log('📝 Starting exam for:', courseCode);
        
        // Find questions for this course
        const questions = await Question.aggregate([
            { $match: { courseCode, mode: 'exam', isActive: true } },
            { $sample: { size: 40 } }
        ]);

        // If no questions in DB, return sample questions
        if (questions.length === 0) {
            const sampleQuestions = Array(40).fill(null).map((_, i) => ({
                _id: `sample_${i}`,
                text: `Sample question ${i + 1} for ${courseCode}`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctOption: 0,
                explanation: 'This is a sample question. Real questions coming soon!'
            }));
            
            return res.json({
                course: courseCode,
                timeLimit: 50,
                questions: sampleQuestions
            });
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
        console.error('❌ Start exam error:', error);
        res.status(500).json({ error: 'Failed to start exam' });
    }
});

// ==================== SUBMIT EXAM SESSION ====================
router.post('/session/submit', protect, async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        
        console.log('📩 Submit received:', { courseCode, timeSpent, answersCount: Object.keys(answers || {}).length });
        
        // Get the user
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Calculate time spent in seconds
        const timeSpentSec = Math.floor((timeSpent || 0) / 1000);
        
        // Update user stats
        user.examsTaken = (user.examsTaken || 0) + 1;
        user.totalStudyTime = (user.totalStudyTime || 0) + timeSpentSec;
        
        // Get correct count if answers provided
        let correctCount = 0;
        let totalQuestions = 0;
        
        if (answers && Object.keys(answers).length > 0) {
            const questionIds = Object.keys(answers).filter(k => !k.startsWith('sample'));
            
            if (questionIds.length > 0) {
                const questions = await Question.find({ _id: { $in: questionIds } });
                totalQuestions = questions.length;
                
                questions.forEach(q => {
                    if (answers[q._id] === q.correctOption) correctCount++;
                });
            } else {
                totalQuestions = Object.keys(answers).length;
                // For sample questions
                Object.keys(answers).forEach(() => {
                    correctCount++; // Count all as correct for samples
                });
            }
        }
        
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        
        // Add score to user history
        user.scores.push({
            course: courseCode || 'Unknown',
            score: correctCount,
            totalQuestions: totalQuestions,
            mode: 'exam',
            date: new Date()
        });
        
        // Check achievements
        if (user.examsTaken === 1) {
            user.achievements.push({
                name: 'First Exam',
                description: 'Completed your first exam!',
                icon: '🎯',
                dateEarned: new Date()
            });
        }
        
        if (score === 100 && totalQuestions > 0) {
            user.achievements.push({
                name: 'Perfect Score',
                description: 'Got 100% on an exam!',
                icon: '🏆',
                dateEarned: new Date()
            });
        }
        
        if (user.examsTaken === 10) {
            user.achievements.push({
                name: 'Exam Warrior',
                description: 'Completed 10 exams!',
                icon: '⚔️',
                dateEarned: new Date()
            });
        }
        
        // Update streak
        const today = new Date().toDateString();
        const lastActive = user.lastActive ? user.lastActive.toDateString() : null;
        
        if (lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastActive === yesterday.toDateString()) {
                user.currentStreak = (user.currentStreak || 0) + 1;
                if (user.currentStreak > (user.longestStreak || 0)) {
                    user.longestStreak = user.currentStreak;
                }
            } else {
                user.currentStreak = 1;
            }
            user.lastActive = new Date();
        }
        
        await user.save();
        
        // Create notification
        await Notification.create({
            user: user._id,
            title: '📝 Exam Completed!',
            message: `You scored ${score}% in ${courseCode || 'exam'}. Keep up the good work!`,
            type: score >= 70 ? 'success' : score >= 50 ? 'info' : 'warning'
        });
        
        console.log('✅ Exam submitted successfully:', { userId: user._id, courseCode, score });
        
        res.json({
            success: true,
            score,
            correctCount,
            totalQuestions,
            message: 'Exam submitted successfully!'
        });
        
    } catch (error) {
        console.error('❌ Submit exam error:', error);
        res.status(500).json({ 
            error: 'Failed to submit exam',
            message: error.message 
        });
    }
});

module.exports = router;
