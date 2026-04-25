const express = require('express');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Start test session
router.post('/session/start', protect, async (req, res) => {
    try {
        const { courseCode } = req.body;
        
        const questions = await Question.aggregate([
            { $match: { courseCode, mode: 'test', isActive: true } },
            { $sample: { size: 30 } }
        ]);

        if (questions.length === 0) {
            const sampleQuestions = Array(30).fill(null).map((_, i) => ({
                id: `sample_test_${i}`,
                text: `Sample test question ${i + 1} for ${courseCode}`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctOption: 0,
                hint: 'Think carefully about the concepts.',
                explanation: 'This is a sample test question.'
            }));
            return res.json({
                course: courseCode,
                timeLimit: 40,
                questions: sampleQuestions
            });
        }

        res.json({
            course: courseCode,
            timeLimit: 40,
            questions: questions.map(q => ({
                id: q._id,
                text: q.text,
                options: q.options,
                correctOption: q.correctOption,
                hint: q.hint || 'Think about the key concepts.',
                explanation: q.explanation
            }))
        });
    } catch (error) {
        console.error('Start test error:', error);
        res.status(500).json({ error: 'Failed to start test' });
    }
});

// Submit test
router.post('/session/submit', protect, async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        
        const questionIds = Object.keys(answers).filter(k => !k.startsWith('sample'));
        let correctCount = 0;
        let totalQuestions = 0;
        
        if (questionIds.length > 0) {
            const questions = await Question.find({ _id: { $in: questionIds } });
            totalQuestions = questions.length;
            questions.forEach(q => {
                if (answers[q._id] === q.correctOption) correctCount++;
            });
        } else {
            totalQuestions = Object.keys(answers).length;
            Object.keys(answers).forEach((key) => {
                if (answers[key] === 0) correctCount++;
            });
        }

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const timeSpentSec = Math.floor(timeSpent / 1000);

        req.user.testsTaken = (req.user.testsTaken || 0) + 1;
        req.user.totalStudyTime = (req.user.totalStudyTime || 0) + timeSpentSec;
        req.user.scores.push({
            course: courseCode,
            score: correctCount,
            totalQuestions: totalQuestions,
            mode: 'test',
            date: new Date()
        });

        if (req.user.testsTaken === 1) {
            req.user.achievements.push({
                name: 'First Test',
                description: 'Completed your first practice test!',
                icon: '🧪'
            });
        }

        await req.user.save();

        await Notification.create({
            user: req.user._id,
            title: '🧪 Test Completed!',
            message: `You scored ${score}% in ${courseCode} test.`,
            type: score >= 70 ? 'success' : 'info'
        });

        res.json({ score, correctCount, totalQuestions });
    } catch (error) {
        console.error('Submit test error:', error);
        res.status(500).json({ error: 'Failed to submit test' });
    }
});

module.exports = router;
