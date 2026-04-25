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
        
        const questions = await Question.aggregate([
            { $match: { courseCode, mode: 'exam', isActive: true } },
            { $sample: { size: 40 } }
        ]);

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
        
        console.log('📩 Submit received:', { 
            courseCode, 
            answersCount: answers ? Object.keys(answers).length : 0,
            timeSpent 
        });
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const timeSpentSec = Math.floor((timeSpent || 0) / 1000);
        
        // ==================== CALCULATE REAL SCORE ====================
        let correctCount = 0;
        let totalQuestions = 0;
        
        if (answers && Object.keys(answers).length > 0) {
            totalQuestions = Object.keys(answers).length;
            
            // Try to find matching questions in DB
            const questions = await Question.find({ 
                courseCode: courseCode,
                mode: 'exam' 
            }).limit(totalQuestions);
            
            if (questions.length > 0) {
                // Match answers by index
                questions.forEach((q, i) => {
                    if (answers[i] !== undefined && answers[i] === q.correctOption) {
                        correctCount++;
                    }
                });
                totalQuestions = questions.length;
                console.log('📊 Matched with DB questions:', { correctCount, totalQuestions });
            } else {
                // No questions in DB - check sample questions
                // Sample questions have correctOption: 0 as default
                Object.keys(answers).forEach(key => {
                    if (answers[key] === 0) correctCount++;
                });
                console.log('📊 Using sample questions:', { correctCount, totalQuestions });
            }
        }
        
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        
        console.log('📊 Final score:', { correctCount, totalQuestions, score });
        
        // ==================== UPDATE USER ====================
        user.examsTaken = (user.examsTaken || 0) + 1;
        user.totalStudyTime = (user.totalStudyTime || 0) + timeSpentSec;
        user.scores.push({
            course: courseCode || 'Unknown',
            score: correctCount,
            totalQuestions: totalQuestions,
            mode: 'exam',
            date: new Date()
        });
        
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
        
        await user.save();
        console.log('✅ User updated:', { examsTaken: user.examsTaken, totalStudyTime: user.totalStudyTime });
        
        // ==================== CREATE NOTIFICATION ====================
        await Notification.create({
            user: user._id,
            title: '📝 Exam Completed!',
            message: `You scored ${score}% in ${courseCode || 'exam'}. ${correctCount}/${totalQuestions} correct.`,
            type: score >= 70 ? 'success' : score >= 50 ? 'info' : 'warning'
        });
        
        console.log('✅ Notification created');
        
        res.json({
            success: true,
            score: score,
            correctCount: correctCount,
            totalQuestions: totalQuestions,
            message: 'Exam submitted successfully!'
        });
        
    } catch (error) {
        console.error('❌ Submit error:', error);
        res.status(500).json({ error: 'Failed to submit exam', message: error.message });
    }
});

module.exports = router;
