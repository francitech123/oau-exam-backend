const express = require('express');
const Question = require('../models/Question');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin status
router.use(protect);

// Get questions for a course
router.get('/questions/:courseCode/:mode', async (req, res) => {
    try {
        const { courseCode, mode } = req.params;
        const questions = await Question.find({ courseCode, mode })
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });
        
        res.json({ questions });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Add single question
router.post('/questions', async (req, res) => {
    try {
        const { courseCode, mode, text, options, correctOption, hint, explanation } = req.body;
        
        const question = await Question.create({
            courseCode,
            mode,
            text,
            options,
            correctOption,
            hint: hint || '',
            explanation: explanation || '',
            createdBy: req.user._id,
            isApproved: true
        });
        
        // Notify users about new question
        await Notification.create({
            isGlobal: true,
            title: '📚 New Question Added',
            message: `A new question has been added to ${courseCode} (${mode} mode).`,
            type: 'update'
        });
        
        res.status(201).json({ success: true, question });
    } catch (error) {
        console.error('Add question error:', error);
        res.status(500).json({ error: 'Failed to add question' });
    }
});

// Delete question
router.delete('/questions/:id', async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

// Get all courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find().sort({ faculty: 1, code: 1 });
        res.json({ courses });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Update course config
router.put('/courses/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { config } = req.body;
        
        const course = await Course.findOneAndUpdate(
            { code },
            { config },
            { new: true, upsert: true }
        );
        
        res.json({ success: true, course });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update course' });
    }
});

// Seed courses
router.post('/seed-courses', async (req, res) => {
    try {
        const courses = [
            // Agriculture
            { code: 'AGR 101', name: 'Intro to Agriculture', faculty: 'Agriculture', semester: 'first', level: '100' },
            { code: 'AGR 102', name: 'Crop Production', faculty: 'Agriculture', semester: 'second', level: '100' },
            { code: 'AGR 103', name: 'Soil Science', faculty: 'Agriculture', semester: 'first', level: '100' },
            { code: 'AGR 104', name: 'Animal Husbandry', faculty: 'Agriculture', semester: 'second', level: '100' },
            // Arts
            { code: 'ENG 101', name: 'Intro to Literature', faculty: 'Arts', semester: 'first', level: '100' },
            { code: 'ENG 102', name: 'Advanced Literature', faculty: 'Arts', semester: 'second', level: '100' },
            { code: 'PHL 101', name: 'Intro to Philosophy', faculty: 'Arts', semester: 'first', level: '100' },
            { code: 'PHL 102', name: 'Logic & Critical Thinking', faculty: 'Arts', semester: 'second', level: '100' },
            { code: 'HIS 101', name: 'History of Nigeria', faculty: 'Arts', semester: 'first', level: '100' },
            { code: 'HIS 102', name: 'World History', faculty: 'Arts', semester: 'second', level: '100' },
            // Law
            { code: 'JIL 101', name: 'Legal Methods', faculty: 'Law', semester: 'first', level: '100' },
            { code: 'JIL 102', name: 'Constitutional Law', faculty: 'Law', semester: 'second', level: '100' },
            { code: 'PIL 101', name: 'Public Intl Law', faculty: 'Law', semester: 'first', level: '100' },
            { code: 'PIL 102', name: 'Private Intl Law', faculty: 'Law', semester: 'second', level: '100' },
            // Science
            { code: 'BIO 101', name: 'General Biology I', faculty: 'Science', semester: 'first', level: '100' },
            { code: 'BIO 102', name: 'General Biology II', faculty: 'Science', semester: 'second', level: '100' },
            { code: 'CHM 101', name: 'General Chemistry I', faculty: 'Science', semester: 'first', level: '100' },
            { code: 'CHM 102', name: 'General Chemistry II', faculty: 'Science', semester: 'second', level: '100' },
            { code: 'MTH 101', name: 'Elementary Math I', faculty: 'Science', semester: 'first', level: '100' },
            { code: 'MTH 102', name: 'Elementary Math II', faculty: 'Science', semester: 'second', level: '100' },
            { code: 'PHY 101', name: 'General Physics I', faculty: 'Science', semester: 'first', level: '100' },
            { code: 'PHY 102', name: 'General Physics II', faculty: 'Science', semester: 'second', level: '100' },
            { code: 'PHY 103', name: 'Physics for Life Sci I', faculty: 'Science', semester: 'first', level: '100' },
            { code: 'PHY 104', name: 'Physics for Life Sci II', faculty: 'Science', semester: 'second', level: '100' },
            // Social Sciences
            { code: 'ECO 101', name: 'Principles of Economics', faculty: 'Social Sciences', semester: 'first', level: '100' },
            { code: 'ECO 102', name: 'Microeconomics', faculty: 'Social Sciences', semester: 'second', level: '100' },
            { code: 'POL 101', name: 'Intro to Politics', faculty: 'Social Sciences', semester: 'first', level: '100' },
            { code: 'POL 102', name: 'Nigerian Government', faculty: 'Social Sciences', semester: 'second', level: '100' },
            { code: 'SOC 101', name: 'Intro to Sociology', faculty: 'Social Sciences', semester: 'first', level: '100' },
            { code: 'SOC 102', name: 'Social Institutions', faculty: 'Social Sciences', semester: 'second', level: '100' },
            { code: 'PSY 101', name: 'Intro to Psychology', faculty: 'Social Sciences', semester: 'first', level: '100' },
            { code: 'PSY 102', name: 'Developmental Psych', faculty: 'Social Sciences', semester: 'second', level: '100' },
            // Education
            { code: 'EDU 101', name: 'Foundations of Education', faculty: 'Education', semester: 'first', level: '100' },
            { code: 'EDU 102', name: 'Educational Psychology', faculty: 'Education', semester: 'second', level: '100' },
            { code: 'EDC 101', name: 'Curriculum Studies', faculty: 'Education', semester: 'first', level: '100' },
            { code: 'EDC 102', name: 'Instructional Methods', faculty: 'Education', semester: 'second', level: '100' },
            { code: 'EDP 101', name: 'Educational Planning', faculty: 'Education', semester: 'first', level: '100' },
            { code: 'EDP 102', name: 'Educational Admin', faculty: 'Education', semester: 'second', level: '100' },
            // Pharmacy
            { code: 'PCY 101', name: 'Intro to Pharmacy', faculty: 'Pharmacy', semester: 'first', level: '100' },
            { code: 'PCY 102', name: 'Pharmacy Practice', faculty: 'Pharmacy', semester: 'second', level: '100' },
            // Technology
            { code: 'GET 101', name: 'Engineering Drawing I', faculty: 'Technology', semester: 'first', level: '100' },
            { code: 'GET 102', name: 'Engineering Drawing II', faculty: 'Technology', semester: 'second', level: '100' },
            // Administration
            { code: 'BUS 101', name: 'Intro to Business', faculty: 'Administration', semester: 'first', level: '100' },
            { code: 'BUS 102', name: 'Business Environment', faculty: 'Administration', semester: 'second', level: '100' },
            { code: 'ACC 101', name: 'Principles of Accounting', faculty: 'Administration', semester: 'first', level: '100' },
            { code: 'ACC 102', name: 'Financial Accounting', faculty: 'Administration', semester: 'second', level: '100' },
            // Environmental Design
            { code: 'ARC 101', name: 'Architectural Design', faculty: 'Environmental Design and Management', semester: 'first', level: '100' },
            { code: 'ARC 102', name: 'Building Technology', faculty: 'Environmental Design and Management', semester: 'second', level: '100' },
            { code: 'URP 101', name: 'Urban Planning', faculty: 'Environmental Design and Management', semester: 'first', level: '100' },
            { code: 'URP 102', name: 'Regional Planning', faculty: 'Environmental Design and Management', semester: 'second', level: '100' },
            { code: 'QSV 101', name: 'Quantity Surveying', faculty: 'Environmental Design and Management', semester: 'first', level: '100' },
            { code: 'QSV 102', name: 'Construction Technology', faculty: 'Environmental Design and Management', semester: 'second', level: '100' },
            // Basic Medical Sciences
            { code: 'ANA 101', name: 'Human Anatomy', faculty: 'Basic Medical Sciences', semester: 'first', level: '100' },
            { code: 'ANA 102', name: 'Gross Anatomy', faculty: 'Basic Medical Sciences', semester: 'second', level: '100' },
            { code: 'PHS 101', name: 'Physiology', faculty: 'Basic Medical Sciences', semester: 'first', level: '100' },
            { code: 'PHS 102', name: 'Systems Physiology', faculty: 'Basic Medical Sciences', semester: 'second', level: '100' },
            { code: 'BCH 101', name: 'Biochemistry', faculty: 'Basic Medical Sciences', semester: 'first', level: '100' },
            { code: 'BCH 102', name: 'Metabolism', faculty: 'Basic Medical Sciences', semester: 'second', level: '100' },
            // Clinical Sciences
            { code: 'MED 101', name: 'Intro to Medicine', faculty: 'Clinical Sciences', semester: 'first', level: '100' },
            { code: 'MED 102', name: 'Clinical Methods', faculty: 'Clinical Sciences', semester: 'second', level: '100' },
            { code: 'SUR 101', name: 'Principles of Surgery', faculty: 'Clinical Sciences', semester: 'first', level: '100' },
            { code: 'SUR 102', name: 'Surgical Techniques', faculty: 'Clinical Sciences', semester: 'second', level: '100' },
            { code: 'OBS 101', name: 'Obstetrics', faculty: 'Clinical Sciences', semester: 'first', level: '100' },
            { code: 'OBS 102', name: 'Gynecology', faculty: 'Clinical Sciences', semester: 'second', level: '100' },
            // Dentistry
            { code: 'DEN 101', name: 'Dental Anatomy', faculty: 'Dentistry', semester: 'first', level: '100' },
            { code: 'DEN 102', name: 'Oral Biology', faculty: 'Dentistry', semester: 'second', level: '100' },
            { code: 'ORA 101', name: 'Oral Health', faculty: 'Dentistry', semester: 'first', level: '100' },
            { code: 'ORA 102', name: 'Preventive Dentistry', faculty: 'Dentistry', semester: 'second', level: '100' },
            // Computing
            { code: 'COS 101', name: 'Intro to Computing', faculty: 'Computing', semester: 'first', level: '100' },
            { code: 'COS 102', name: 'Programming Fundamentals', faculty: 'Computing', semester: 'second', level: '100' },
            { code: 'STA 111', name: 'Intro to Statistics I', faculty: 'Computing', semester: 'first', level: '100' },
            { code: 'STA 112', name: 'Intro to Statistics II', faculty: 'Computing', semester: 'second', level: '100' },
            { code: 'STA 121', name: 'Statistical Methods I', faculty: 'Computing', semester: 'first', level: '100' },
            // GST (All faculties)
            { code: 'GST 111', name: 'Use of English I', faculty: 'All', semester: 'first', level: '100' },
            { code: 'GST 112', name: 'Use of English II', faculty: 'All', semester: 'second', level: '100' }
        ];

        let count = 0;
        for (const course of courses) {
            await Course.findOneAndUpdate(
                { code: course.code },
                course,
                { upsert: true, new: true }
            );
            count++;
        }

        res.json({ success: true, message: `${count} courses seeded successfully` });
    } catch (error) {
        console.error('Seed courses error:', error);
        res.status(500).json({ error: 'Failed to seed courses' });
    }
});

module.exports = router;
