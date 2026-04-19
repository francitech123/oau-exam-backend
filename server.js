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

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, password, faculty, department, level } = req.body;
        
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: 'Username exists' });
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
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123');
        
        res.json({ token, user: { id: user._id, fullName: user.fullName, username: user.username } });
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
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123');
        
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
app.post('/api/seed', async (req, res) => {
    await seedDatabase();
    res.json({ success: true, message: 'Database seeded successfully!' });
});
app.get('/api/courses', async (req, res) => {
app.get('/api/seed', async (req, res) => {
    await seedDatabase();
    res.json({ success: true, message: 'Database seeded successfully!' });
});
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

// Start exam/test session
app.post('/api/exams/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        
        let questions = await Question.find({ courseCode, mode: 'exam' });
        
        if (questions.length === 0) {
            questions = [
                { text: 'Sample Question 1?', options: ['A', 'B', 'C', 'D'], correctOption: 0, explanation: 'Sample explanation' },
                { text: 'Sample Question 2?', options: ['A', 'B', 'C', 'D'], correctOption: 1, explanation: 'Sample explanation' },
                { text: 'Sample Question 3?', options: ['A', 'B', 'C', 'D'], correctOption: 2, explanation: 'Sample explanation' }
            ];
        }
        
        res.json({
            sessionId: Date.now().toString(),
            course: courseCode,
            mode: 'exam',
            timeLimit: 50,
            questions: questions.slice(0, 10).map(q => ({
                id: q._id || Date.now(),
                text: q.text,
                options: q.options
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tests/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        
        let questions = await Question.find({ courseCode, mode: 'test' });
        
        if (questions.length === 0) {
            questions = [
                { text: 'Practice Question 1?', options: ['A', 'B', 'C', 'D'], correctOption: 0, hint: 'Think carefully', explanation: 'Sample explanation' },
                { text: 'Practice Question 2?', options: ['A', 'B', 'C', 'D'], correctOption: 1, hint: 'Consider all options', explanation: 'Sample explanation' }
            ];
        }
        
        res.json({
            sessionId: Date.now().toString(),
            course: courseCode,
            mode: 'test',
            timeLimit: 40,
            questions: questions.slice(0, 8).map(q => ({
                id: q._id || Date.now(),
                text: q.text,
                options: q.options,
                hint: q.hint
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Seed initial data
app.post('/api/seed', async (req, res) => {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            await User.create({
                fullName: 'Administrator',
                username: 'admin',
                password: await bcrypt.hash('admin123', 10),
                faculty: 'Technology',
                department: 'Admin',
                level: '500',
                isAdmin: true
            });
        }
        
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
        }
        
        res.json({ success: true, message: 'Database seeded!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oau_exam';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
    });
