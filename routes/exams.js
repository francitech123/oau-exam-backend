const express = require('express');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Start exam session
router.post('/session/start', protect, async (req, res) => {
    try {
        const { courseCode } = req.body;
        
        // Find questions for this course
        const questions = await Question.aggregate([
            { $match: { courseCode, mode: 'exam', isActive: true } },
            { $sample: { size: 40 } }
        ]);

        // If no questions in DB, return sample questions
        if (questions.length === 0) {
            const sampleQuestions = generateSampleQuestions(courseCode, 40);
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
        console.error('Start exam error:', error);
        res.status(500).json({ error: 'Failed to start exam' });
    }
});

// Submit exam
router.post('/session/submit', protect, async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        
        // Get questions to check answers
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
            // Sample questions were used - calculate from the answers array
            totalQuestions = Object.keys(answers).length;
            // For sample questions, correctOption is stored in the answer key
            Object.keys(answers).forEach((key, index) => {
                // Sample questions have correctOption = 0 by default pattern
                if (answers[key] === 0) correctCount++;
            });
        }

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const timeSpentSec = Math.floor(timeSpent / 1000);

        // Update user stats
        req.user.examsTaken = (req.user.examsTaken || 0) + 1;
        req.user.totalStudyTime = (req.user.totalStudyTime || 0) + timeSpentSec;
        req.user.scores.push({
            course: courseCode,
            score: correctCount,
            totalQuestions: totalQuestions,
            mode: 'exam',
            date: new Date()
        });

        // Check achievements
        if (req.user.examsTaken === 1) {
            req.user.achievements.push({
                name: 'First Exam',
                description: 'Completed your first exam!',
                icon: '🎯'
            });
        }
        if (score === 100 && totalQuestions > 0) {
            req.user.achievements.push({
                name: 'Perfect Score',
                description: 'Got 100% on an exam!',
                icon: '🏆'
            });
        }
        if (req.user.examsTaken === 10) {
            req.user.achievements.push({
                name: 'Exam Warrior',
                description: 'Completed 10 exams!',
                icon: '⚔️'
            });
        }

        await req.user.save();

        // Create notification
        await Notification.create({
            user: req.user._id,
            title: '📝 Exam Completed!',
            message: `You scored ${score}% in ${courseCode}. ${totalQuestions} questions answered.`,
            type: score >= 70 ? 'success' : score >= 50 ? 'info' : 'warning'
        });

        res.json({
            score,
            correctCount,
            totalQuestions
        });
    } catch (error) {
        console.error('Submit exam error:', error);
        res.status(500).json({ error: 'Failed to submit exam' });
    }
});

// Generate sample questions when DB is empty
function generateSampleQuestions(courseCode, count) {
    const samples = [];
    for (let i = 0; i < count; i++) {
        samples.push({
            id: `sample_${courseCode.replace(/\s+/g, '')}_${i}`,
            text: `Sample question ${i + 1} for ${courseCode}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctOption: 0,
            explanation: 'This is a sample question. Real questions will be added soon!'
        });
    }
    return samples;
}

module.exports = router;
