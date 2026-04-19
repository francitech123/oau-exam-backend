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
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, sparse: true },
    password: { type: String, required: true },
    faculty: { type: String, required: true },
    department: { type: String, required: true },
    level: { type: String, required: true },
    securityQuestion: { type: String },
    securityAnswer: { type: String },
    isAdmin: { type: Boolean, default: false },
    examsTaken: { type: Number, default: 0 },
    testsTaken: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    studyGoals: { type: Number, default: 10 },
    achievements: [{
        name: String,
        description: String,
        dateEarned: { type: Date, default: Date.now }
    }],
    scores: [{
        course: String,
        score: Number,
        totalQuestions: Number,
        percentage: Number,
        mode: String,
        date: { type: Date, default: Date.now }
    }],
    preferences: {
        darkMode: { type: Boolean, default: true },
        language: { type: String, default: 'en' }
    },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const examQuestionSchema = new mongoose.Schema({
    courseCode: String,
    faculty: String,
    semester: String,
    mode: { type: String, default: 'exam' },
    text: String,
    options: [String],
    correctOption: Number,
    explanation: String,
    difficulty: { type: String, default: 'medium' }
});

const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

const testQuestionSchema = new mongoose.Schema({
    courseCode: String,
    faculty: String,
    semester: String,
    mode: { type: String, default: 'test' },
    text: String,
    options: [String],
    correctOption: Number,
    explanation: String,
    hint: String,
    difficulty: { type: String, default: 'medium' }
});

const TestQuestion = mongoose.model('TestQuestion', testQuestionSchema);

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    message: String,
    type: { type: String, enum: ['success', 'info', 'warning', 'achievement'] },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// ==================== SEED FUNCTION ====================
async function seedDatabase() {
    try {
        // Create admin
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            await User.create({
                fullName: 'Administrator',
                username: 'admin',
                email: 'admin@oauexamplug.com',
                password: await bcrypt.hash('admin123', 12),
                faculty: 'Technology',
                department: 'Admin',
                level: '500',
                securityQuestion: 'pet',
                securityAnswer: 'admin',
                isAdmin: true,
                examsTaken: 10,
                totalStudyTime: 7200,
                currentStreak: 7,
                achievements: [
                    { name: 'First Exam', description: 'Completed first exam' },
                    { name: 'Week Warrior', description: '7-day streak' }
                ]
            });
            console.log('✅ Admin created');
        }

        // Create student
        const studentExists = await User.findOne({ username: 'student' });
        if (!studentExists) {
            await User.create({
                fullName: 'Demo Student',
                username: 'student',
                email: 'student@oauexamplug.com',
                password: await bcrypt.hash('pass123', 12),
                faculty: 'Technology',
                department: 'Computer Engineering',
                level: '300',
                securityQuestion: 'pet',
                securityAnswer: 'max',
                examsTaken: 5,
                totalStudyTime: 3600,
                currentStreak: 3,
                scores: [
                    { course: 'CHM 101', score: 38, totalQuestions: 40, percentage: 95, mode: 'exam' }
                ]
            });
            console.log('✅ Student created');
        }

        // Seed courses and questions
        const courses = [
            { code: 'CHM 101', name: 'General Chemistry I', faculty: 'Technology', semester: 'first' },
            { code: 'CHM 102', name: 'General Chemistry II', faculty: 'Technology', semester: 'second' },
            { code: 'MTH 101', name: 'Elementary Mathematics I', faculty: 'Technology', semester: 'first' },
            { code: 'MTH 102', name: 'Elementary Mathematics II', faculty: 'Technology', semester: 'second' },
            { code: 'PHY 101', name: 'General Physics I', faculty: 'Technology', semester: 'first' },
            { code: 'PHY 102', name: 'General Physics II', faculty: 'Technology', semester: 'second' },
            { code: 'COS 101', name: 'Introduction to Computing', faculty: 'Technology', semester: 'first' },
            { code: 'COS 102', name: 'Programming Fundamentals', faculty: 'Technology', semester: 'second' },
            { code: 'BIO 101', name: 'General Biology I', faculty: 'Science', semester: 'first' },
            { code: 'BIO 102', name: 'General Biology II', faculty: 'Science', semester: 'second' }
        ];

        for (const c of courses) {
            const qExists = await ExamQuestion.findOne({ courseCode: c.code });
            if (!qExists) {
                await ExamQuestion.create([
                    { courseCode: c.code, faculty: c.faculty, semester: c.semester, mode: 'exam', text: `Sample ${c.code} Exam Question 1`, options: ['A', 'B', 'C', 'D'], correctOption: 0, explanation: 'Sample explanation', difficulty: 'easy' },
                    { courseCode: c.code, faculty: c.faculty, semester: c.semester, mode: 'exam', text: `Sample ${c.code} Exam Question 2`, options: ['A', 'B', 'C', 'D'], correctOption: 1, explanation: 'Sample explanation', difficulty: 'medium' }
                ]);
                await TestQuestion.create([
                    { courseCode: c.code, faculty: c.faculty, semester: c.semester, mode: 'test', text: `Sample ${c.code} Test Question 1`, options: ['A', 'B', 'C', 'D'], correctOption: 0, hint: 'Think carefully', explanation: 'Sample explanation' },
                    { courseCode: c.code, faculty: c.faculty, semester: c.semester, mode: 'test', text: `Sample ${c.code} Test Question 2`, options: ['A', 'B', 'C', 'D'], correctOption: 1, hint: 'Consider all options', explanation: 'Sample explanation' }
                ]);
            }
        }
        console.log('✅ Courses and questions seeded');
    } catch (error) {
        console.error('Seeding error:', error);
    }
}

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'OAU Exam Plug API' });
});

// Seed
app.get('/api/seed', async (req, res) => {
    await seedDatabase();
    res.json({ success: true });
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, email, password, faculty, department, level, securityQuestion, securityAnswer } = req.body;
        
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        if (!/[A-Z]/.test(password)) return res.status(400).json({ error: 'Password must contain uppercase letter' });
        if (!/[0-9]/.test(password)) return res.status(400).json({ error: 'Password must contain number' });
        
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: 'Username exists' });
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            fullName, username, email, password: hashedPassword, faculty, department, level,
            securityQuestion, securityAnswer: securityAnswer.toLowerCase()
        });
        
        await Notification.create({
            user: user._id,
            title: 'Welcome to OAU Exam Plug!',
            message: `Welcome ${fullName}! Start practicing today.`,
            type: 'success'
        });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        
        // Update streak
        const today = new Date().toDateString();
        const lastActive = user.lastActive?.toDateString();
        if (lastActive !== today) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            user.currentStreak = (lastActive === yesterday.toDateString()) ? user.currentStreak + 1 : 1;
            user.lastActive = new Date();
            
            if (user.currentStreak === 7) {
                user.achievements.push({ name: 'Week Warrior', description: '7-day streak!' });
                await Notification.create({ user: user._id, title: '🏆 Achievement Unlocked!', message: 'Week Warrior: 7-day streak!', type: 'achievement' });
            }
            await user.save();
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get courses
app.get('/api/courses', async (req, res) => {
    const courses = {
        Technology: {
            first: ['CHM 101', 'MTH 101', 'PHY 101', 'COS 101'],
            second: ['CHM 102', 'MTH 102', 'PHY 102', 'COS 102']
        },
        Science: {
            first: ['BIO 101', 'CHM 101', 'MTH 101', 'PHY 101'],
            second: ['BIO 102', 'CHM 102', 'MTH 102', 'PHY 102']
        }
    };
    res.json({ courses });
});

// Get leaderboard (masked names)
app.get('/api/users/leaderboard', async (req, res) => {
    try {
        const users = await User.find({ 'scores.0': { $exists: true } })
            .select('fullName faculty examsTaken scores achievements').limit(20);
        
        const leaderboard = users.map(user => {
            const avg = user.scores.length ? Math.round(user.scores.reduce((a, b) => a + (b.percentage || 0), 0) / user.scores.length) : 0;
            const maskedName = user.fullName.split(' ').map(n => n.substring(0, 3) + '***').join(' ');
            return { id: user._id, name: maskedName, faculty: user.faculty, examsTaken: user.examsTaken, averageScore: avg };
        }).sort((a, b) => b.averageScore - a.averageScore);
        
        res.json({ leaderboard });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get notifications
app.get('/api/users/notifications', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const notifications = await Notification.find({ user: decoded.id }).sort({ createdAt: -1 }).limit(50);
        res.json({ notifications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark notifications read
app.put('/api/users/notifications/read', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        await Notification.updateMany({ user: decoded.id, read: false }, { read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update profile
app.put('/api/users/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { fullName, email, faculty, department, level, preferences } = req.body;
        
        const user = await User.findById(decoded.id);
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (faculty) user.faculty = faculty;
        if (department) user.department = department;
        if (level) user.level = level;
        if (preferences) user.preferences = { ...user.preferences, ...preferences };
        
        await user.save();
        res.json({ success: true, user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Change password
app.post('/api/auth/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { currentPassword, newPassword } = req.body;
        
        if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain uppercase letter' });
        if (!/[0-9]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain number' });
        
        const user = await User.findById(decoded.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });
        
        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start exam session
app.post('/api/exams/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        const questions = await ExamQuestion.find({ courseCode, mode: 'exam' }).limit(40);
        res.json({ sessionId: Date.now().toString(), course: courseCode, mode: 'exam', timeLimit: 50, questions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start test session
app.post('/api/tests/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        const questions = await TestQuestion.find({ courseCode, mode: 'test' }).limit(30);
        res.json({ sessionId: Date.now().toString(), course: courseCode, mode: 'test', timeLimit: 40, questions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit exam
app.post('/api/exams/session/submit', async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id);
        
        const questionIds = Object.keys(answers);
        const questions = await ExamQuestion.find({ _id: { $in: questionIds } });
        
        let correct = 0;
        questions.forEach(q => { if (answers[q._id] === q.correctOption) correct++; });
        
        const percentage = Math.round((correct / questions.length) * 100);
        
        user.examsTaken += 1;
        user.totalStudyTime += Math.floor(timeSpent / 1000);
        user.scores.push({ course: courseCode, score: correct, totalQuestions: questions.length, percentage, mode: 'exam' });
        
        // Check achievements
        if (user.examsTaken === 1) {
            user.achievements.push({ name: 'First Exam', description: 'Completed your first exam!' });
            await Notification.create({ user: user._id, title: '🏆 Achievement Unlocked!', message: 'First Exam completed!', type: 'achievement' });
        }
        if (percentage >= 90) {
            user.achievements.push({ name: 'Excellence', description: 'Scored 90% or above!' });
            await Notification.create({ user: user._id, title: '🏆 Achievement Unlocked!', message: 'Excellence: 90%+ score!', type: 'achievement' });
        }
        
        await user.save();
        
        await Notification.create({
            user: user._id,
            title: 'Exam Completed!',
            message: `You scored ${percentage}% in ${courseCode}`,
            type: 'success'
        });
        
        res.json({ score: percentage, correctCount: correct, totalQuestions: questions.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AI Chat endpoint (Gemini)
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) return res.status(500).json({ error: 'AI not configured' });
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `You are ExamPlugAI by Francistech, an educational assistant for OAU students. ${message}` }] }]
            })
        });
        
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I cannot respond at the moment.';
        
        res.json({ reply });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        await seedDatabase();
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => console.error('❌ MongoDB error:', err.message));
