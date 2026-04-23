const express = require('express');
const Question = require('../models/Question');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Start exam session
router.post('/session/start', protect, async (req, res) => {
    try {
        const { courseCode } = req.body;
        
        const questions = await Question.aggregate([
            { $match: { courseCode, mode: 'exam' } },
            { $sample: { size: 40 } }
        ]);

        if (questions.length === 0) {
            const sampleQuestions = Array(40).fill(null).map((_, i) => ({
                text: `Sample question ${i + 1} for ${courseCode}`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctOption: 0
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
                correctOption: q.correctOption
            }))
        });
    } catch (error) {
        console.error('Start exam error:', error);
        res.status(500).json({ error: 'Failed to start exam' });
    }
});

// Submit exam
router.post('/session/submit', protect, async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        
        const questionIds = Object.keys(answers);
        const questions = await Question.find({ _id: { $in: questionIds } });
        
        let correctCount = 0;
        questions.forEach(q => {
            if (answers[q._id] === q.correctOption) correctCount++;
        });

        const score = Math.round((correctCount / questions.length) * 100);
        const timeSpentSec = Math.floor(timeSpent / 1000);

        req.user.examsTaken += 1;
        req.user.totalStudyTime += timeSpentSec;
        req.user.scores.push({
            course: courseCode,
            score: correctCount,
            totalQuestions: questions.length,
            mode: 'exam',
            date: new Date()
        });

        if (req.user.examsTaken === 1) {
            req.user.achievements.push({
                name: 'First Exam',
                description: 'Completed your first exam!',
                icon: '🎯'
            });
        }

        if (score === 100) {
            req.user.achievements.push({
                name: 'Perfect Score',
                description: 'Got 100% on an exam!',
                icon: '🏆'
            });
        }

        await req.user.save();

        await Notification.create({
            user: req.user._id,
            title: '📝 Exam Completed!',
            message: `You scored ${score}% in ${courseCode}`,
            type: score >= 70 ? 'success' : 'info'
        });

        res.json({
            score,
            correctCount,
            totalQuestions: questions.length
        });
    } catch (error) {
        console.error('Submit exam error:', error);
        res.status(500).json({ error: 'Failed to submit exam' });
    }
});

module.exports = router;
