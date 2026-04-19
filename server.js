const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ==================== MODELS ====================
const userSchema = new mongoose.Schema({
    fullName: String,
    username: { type: String, unique: true },
    password: String,
    faculty: String,
    department: String,
    level: String,
    isAdmin: { type: Boolean, default: false },
    examsTaken: { type: Number, default: 0 },
    testsTaken: { type: Number, default: 0 },
    scores: [{
        course: String,
        percentage: Number,
        mode: String,
        date: { type: Date, default: Date.now }
    }]
});

const User = mongoose.model('User', userSchema);

const questionSchema = new mongoose.Schema({
    courseCode: String,
    mode: String,
    text: String,
    options: [String],
    correctOption: Number,
    explanation: String,
    difficulty: { type: String, default: 'medium' }
});

const Question = mongoose.model('Question', questionSchema);

// ==================== SEED FUNCTION ====================
async function seedDatabase() {
    try {
        // Create admin user
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            await User.create({
                fullName: 'Administrator',
                username: 'admin',
                password: await bcrypt.hash('admin123', 10),
                faculty: 'Technology',
                department: 'Admin',
                level: '500',
                isAdmin: true,
                examsTaken: 5,
                scores: [
                    { course: 'CHM 101', percentage: 95, mode: 'exam' },
                    { course: 'MTH 101', percentage: 88, mode: 'exam' }
                ]
            });
            console.log('✅ Admin user created');
        }

        // Create student user
        const studentExists = await User.findOne({ username: 'student' });
        if (!studentExists) {
            await User.create({
                fullName: 'Demo Student',
                username: 'student',
                password: await bcrypt.hash('pass123', 10),
                faculty: 'Technology',
                department: 'Computer Engineering',
                level: '300',
                examsTaken: 3,
                scores: [
                    { course: 'CHM 101', percentage: 85, mode: 'exam' },
                    { course: 'MTH 101', percentage: 78, mode: 'exam' }
                ]
            });
            console.log('✅ Student user created');
        }

        // Create sample questions
        const qExists = await Question.findOne({ courseCode: 'CHM 101' });
        if (!qExists) {
            await Question.create([
                { courseCode: 'CHM 101', mode: 'exam', text: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correctOption: 1, explanation: 'Carbon has 6 protons.' },
                { courseCode: 'CHM 101', mode: 'exam', text: 'Which is a noble gas?', options: ['Oxygen', 'Nitrogen', 'Helium', 'Hydrogen'], correctOption: 2, explanation: 'Helium is a noble gas.' },
                { courseCode: 'CHM 101', mode: 'test', text: 'What is H2O commonly known as?', options: ['Salt', 'Water', 'Sugar', 'Alcohol'], correctOption: 1, explanation: 'H2O is water.', hint: 'You drink it.' },
                { courseCode: 'MTH 101', mode: 'exam', text: 'What is 15 + 27?', options: ['32', '42', '52', '62'], correctOption: 1, explanation: '15 + 27 = 42' }
            ]);
            console.log('✅ Sample questions created');
        }

        console.log('🎉 Database seeding complete!');
    } catch (error) {
        console.error('Seeding error:', error);
    }
}

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'OAU Exam Plug API is running!' });
});

// Seed endpoint - GET
app.get('/api/seed', async (req, res) => {
    await seedDatabase();
    res.json({ success: true, message: 'Database seeded successfully!' });
});

// Seed endpoint - POST
app.post('/api/seed', async (req, res) => {
    await seedDatabase();
    res.json({ success: true, message: 'Database seeded successfully!' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, password, faculty, department, level } = req.body;
        
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({
            fullName,
            username,
            password: hashedPassword,
            faculty,
            department,
            level
        });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        
        res.json({ 
            token, 
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                faculty: user.faculty,
                department: user.department,
                level: user.level,
                isAdmin: user.isAdmin,
                examsTaken: user.examsTaken,
                testsTaken: user.testsTaken,
                scores: user.scores
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        
        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                faculty: user.faculty,
                department: user.department,
                level: user.level,
                isAdmin: user.isAdmin,
                examsTaken: user.examsTaken,
                testsTaken: user.testsTaken,
                scores: user.scores
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get courses
app.get('/api/courses', async (req, res) => {
    const courses = {
        Technology: {
            first: [
                { code: 'CHM 101', name: 'General Chemistry I' },
                { code: 'MTH 101', name: 'Elementary Mathematics I' },
                { code: 'PHY 101', name: 'General Physics I' },
                { code: 'COS 101', name: 'Introduction to Computing' }
            ]
        },
        Science: {
            first: [
                { code: 'BIO 101', name: 'General Biology I' },
                { code: 'CHM 101', name: 'General Chemistry I' },
                { code: 'MTH 101', name: 'Elementary Mathematics I' }
            ]
        }
    };
    res.json({ courses });
});

// Start exam session
app.post('/api/exams/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        
        let questions = await Question.find({ courseCode, mode: 'exam' });
        
        if (questions.length === 0) {
            await seedDatabase();
            questions = await Question.find({ courseCode, mode: 'exam' });
        }
        
        res.json({
            sessionId: Date.now().toString(),
            course: courseCode,
            mode: 'exam',
            timeLimit: 50,
            questions: questions.slice(0, 10).map(q => ({
                id: q._id,
                text: q.text,
                options: q.options,
                correctOption: q.correctOption,
                explanation: q.explanation
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start test session
app.post('/api/tests/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        
        let questions = await Question.find({ courseCode, mode: 'test' });
        
        if (questions.length === 0) {
            await seedDatabase();
            questions = await Question.find({ courseCode, mode: 'test' });
        }
        
        res.json({
            sessionId: Date.now().toString(),
            course: courseCode,
            mode: 'test',
            timeLimit: 40,
            questions: questions.slice(0, 8).map(q => ({
                id: q._id,
                text: q.text,
                options: q.options,
                correctOption: q.correctOption,
                explanation: q.explanation,
                hint: q.hint || 'Think carefully!'
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit exam
app.post('/api/exams/session/submit', async (req, res) => {
    try {
        const { answers } = req.body;
        
        const questionIds = Object.keys(answers);
        const questions = await Question.find({ _id: { $in: questionIds } });
        
        let correctCount = 0;
        
        questions.forEach(q => {
            if (answers[q._id] === q.correctOption) correctCount++;
        });
        
        const percentage = Math.round((correctCount / questions.length) * 100);
        
        res.json({
            score: percentage,
            correctCount,
            totalQuestions: questions.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        
        // Auto-seed on startup
        await seedDatabase();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Login: admin/admin123 or student/pass123`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
    });
