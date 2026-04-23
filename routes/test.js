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
            { $match: { courseCode, mode: 'test' } },
            { $sample: { size: 30 } }
        ]);

        if (questions.length === 0) {
            const sampleQuestions = Array(30).fill(null).map((_, i) => ({
                text: `Sample test question ${i + 1} for ${courseCode}`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctOption: 0,
                hint: 'Think carefully about the concepts.'
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
                hint: q.hint
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
        
        const questionIds = Object.keys(answers);
        const questions = await Question.find({ _id: { $in: questionIds } });
        
        let correctCount = 0;
        questions.forEach(q => {
            if (answers[q._id] === q.correctOption) correctCount++;
        });

        const score = Math.round((correctCount / questions.length) * 100);
        const timeSpentSec = Math.floor(timeSpent / 1000);

        req.user.testsTaken += 1;
        req.user.totalStudyTime += timeSpentSec;
        req.user.scores.push({
            course: courseCode,
            score: correctCount,
            totalQuestions: questions.length,
            mode: 'test',
            date: new Date()
        });

        await req.user.save();

        await Notification.create({
            user: req.user._id,
            title: '🧪 Test Completed!',
            message: `You scored ${score}% in ${courseCode} test`,
            type: score >= 70 ? 'success' : 'info'
        });

        res.json({
            score,
            correctCount,
            totalQuestions: questions.length
        });
    } catch (error) {
        console.error('Submit test error:', error);
        res.status(500).json({ error: 'Failed to submit test' });
    }
});

module.exports = router;
