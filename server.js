const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'OAU Exam Plug API is running!' });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== MODELS ====================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: String,
    password: { type: String, required: true },
    faculty: { type: String, required: true },
    department: { type: String, required: true },
    level: { type: String, required: true },
    securityQuestion: String,
    securityAnswer: String,
    isAdmin: { type: Boolean, default: false },
    examsTaken: { type: Number, default: 0 },
    testsTaken: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    studyGoals: { type: Number, default: 10 },
    achievements: [{ name: String, description: String, dateEarned: { type: Date, default: Date.now } }],
    scores: [{ course: String, score: Number, totalQuestions: Number, percentage: Number, mode: String, date: { type: Date, default: Date.now } }],
    preferences: { darkMode: { type: Boolean, default: true } },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const examQuestionSchema = new mongoose.Schema({
    courseCode: String, faculty: String, semester: String, mode: { type: String, default: 'exam' },
    text: String, options: [String], correctOption: Number, explanation: String
});

const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

const testQuestionSchema = new mongoose.Schema({
    courseCode: String, faculty: String, semester: String, mode: { type: String, default: 'test' },
    text: String, options: [String], correctOption: Number, explanation: String, hint: String
});

const TestQuestion = mongoose.model('TestQuestion', testQuestionSchema);

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String, message: String, type: String, read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// ==================== SEED ====================
async function seedDatabase() {
    try {
        // Create sample questions if none exist
        const qCount = await ExamQuestion.countDocuments();
        if (qCount === 0) {
            const courses = [
                { code: 'CHM 101', faculty: 'Technology', semester: 'first' },
                { code: 'MTH 101', faculty: 'Technology', semester: 'first' },
                { code: 'PHY 101', faculty: 'Technology', semester: 'first' },
                { code: 'GST 111', faculty: 'Technology', semester: 'first' }
            ];
            
            for (const c of courses) {
                await ExamQuestion.create([
                    { courseCode: c.code, faculty: c.faculty, semester: c.semester, mode: 'exam', text: `${c.code} Sample Exam Question 1`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0, explanation: 'This is a sample explanation.' },
                    { courseCode: c.code, faculty: c.faculty, semester: c.semester, mode: 'exam', text: `${c.code} Sample Exam Question 2`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 1, explanation: 'This is a sample explanation.' }
                ]);
                await TestQuestion.create([
                    { courseCode: c.code, faculty: c.faculty, semester: c.semester, mode: 'test', text: `${c.code} Sample Test Question 1`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0, hint: 'Think carefully!', explanation: 'This is a sample explanation.' }
                ]);
            }
            console.log('✅ Sample questions created');
        }
    } catch (e) {
        console.error('Seed error:', e.message);
    }
}

// ==================== ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, email, password, faculty, department, level, securityQuestion, securityAnswer } = req.body;
        
        if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: 'Username already taken' });
        
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            fullName, username, email, password: hashed, faculty, department, level,
            securityQuestion, securityAnswer: securityAnswer?.toLowerCase(),
            currentStreak: 1, lastActive: new Date()
        });
        
        await Notification.create({ user: user._id, title: '🎉 Welcome!', message: `Welcome ${fullName}! Start practicing today.`, type: 'success' });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid username or password' });
        
        // Update streak
        const today = new Date().toDateString();
        const last = user.lastActive?.toDateString();
        if (last !== today) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            user.currentStreak = (last === yesterday.toDateString()) ? (user.currentStreak || 0) + 1 : 1;
            user.lastActive = new Date();
            
            if (user.currentStreak === 7) {
                user.achievements.push({ name: 'Week Warrior', description: '7-day study streak!' });
                await Notification.create({ user: user._id, title: '🏆 Achievement!', message: 'Week Warrior: 7-day streak!', type: 'achievement' });
            }
            await user.save();
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get courses
app.get('/api/courses', (req, res) => {
    res.json({
        courses: {
            Technology: { first: ['CHM 101', 'MTH 101', 'PHY 101', 'PHY 103', 'GST 111'], second: ['CHM 102', 'MTH 102', 'PHY 102', 'PHY 104', 'GST 112'] },
            Science: { first: ['BIO 101', 'CHM 101', 'MTH 101', 'PHY 101', 'GST 111'], second: ['BIO 102', 'CHM 102', 'MTH 102', 'PHY 102', 'GST 112'] },
            Arts: { first: ['GST 111'], second: ['GST 112'] },
            Administration: { first: ['GST 111'], second: ['GST 112'] }
        }
    });
});

// LEADERBOARD - FIXED
app.get('/api/users/leaderboard', async (req, res) => {
    try {
        const users = await User.find({}).select('fullName faculty examsTaken testsTaken scores achievements createdAt').lean();
        
        const leaderboard = users.map(u => {
            const scores = u.scores || [];
            const avg = scores.length ? Math.round(scores.reduce((a, b) => a + (b.percentage || 0), 0) / scores.length) : 0;
            const masked = (u.fullName || 'User').split(' ').map(n => n.substring(0, 3) + '***').join(' ');
            return {
                id: u._id,
                name: masked,
                faculty: u.faculty || 'N/A',
                examsTaken: u.examsTaken || 0,
                testsTaken: u.testsTaken || 0,
                overallAvg: avg,
                achievements: (u.achievements || []).length,
                registeredDate: u.createdAt || new Date()
            };
        }).sort((a, b) => b.overallAvg - a.overallAvg);
        
        res.json({ leaderboard });
    } catch (e) {
        console.error('Leaderboard error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get notifications
app.get('/api/users/notifications', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const notifs = await Notification.find({ user: decoded.id }).sort({ createdAt: -1 }).limit(50);
        res.json({ notifications: notifs });
    } catch (e) {
        res.status(500).json({ error: e.message });
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
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update profile
app.put('/api/users/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { fullName, email, faculty, department, level, studyGoals, preferences } = req.body;
        const user = await User.findById(decoded.id);
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (faculty) user.faculty = faculty;
        if (department) user.department = department;
        if (level) user.level = level;
        if (studyGoals) user.studyGoals = studyGoals;
        if (preferences) user.preferences = { ...user.preferences, ...preferences };
        await user.save();
        res.json({ success: true, user: { ...user.toObject(), password: undefined } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Change password
app.post('/api/auth/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { currentPassword, newPassword } = req.body;
        if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        const user = await User.findById(decoded.id);
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Start exam
app.post('/api/exams/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        let questions = await ExamQuestion.find({ courseCode, mode: 'exam' }).limit(40);
        if (questions.length === 0) {
            questions = [{ text: 'Sample Question', options: ['A', 'B', 'C', 'D'], correctOption: 0, explanation: 'Sample' }];
        }
        res.json({ sessionId: Date.now().toString(), course: courseCode, mode: 'exam', timeLimit: 50, questions });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Start test
app.post('/api/tests/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        let questions = await TestQuestion.find({ courseCode, mode: 'test' }).limit(30);
        if (questions.length === 0) {
            questions = [{ text: 'Sample Question', options: ['A', 'B', 'C', 'D'], correctOption: 0, hint: 'Think carefully', explanation: 'Sample' }];
        }
        res.json({ sessionId: Date.now().toString(), course: courseCode, mode: 'test', timeLimit: 40, questions });
    } catch (e) {
        res.status(500).json({ error: e.message });
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
        
        const qIds = Object.keys(answers);
        const questions = await ExamQuestion.find({ _id: { $in: qIds } });
        let correct = 0;
        questions.forEach(q => { if (answers[q._id] === q.correctOption) correct++; });
        const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
        
        user.examsTaken = (user.examsTaken || 0) + 1;
        user.totalStudyTime = (user.totalStudyTime || 0) + Math.floor((timeSpent || 0) / 1000);
        user.scores.push({ course: courseCode, score: correct, totalQuestions: questions.length, percentage: pct, mode: 'exam' });
        
        if (user.examsTaken === 1) {
            user.achievements.push({ name: 'First Exam', description: 'Completed your first exam!' });
            await Notification.create({ user: user._id, title: '🏆 Achievement!', message: 'First Exam completed!', type: 'achievement' });
        }
        if (pct >= 90) {
            user.achievements.push({ name: 'Excellence', description: 'Scored 90% or above!' });
        }
        
        await user.save();
        await Notification.create({ user: user._id, title: '📝 Exam Completed!', message: `You scored ${pct}% in ${courseCode}`, type: 'success' });
        
        res.json({ score: pct, correctCount: correct, totalQuestions: questions.length });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Submit test
app.post('/api/tests/session/submit', async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id);
        
        const qIds = Object.keys(answers);
        const questions = await TestQuestion.find({ _id: { $in: qIds } });
        let correct = 0;
        questions.forEach(q => { if (answers[q._id] === q.correctOption) correct++; });
        const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
        
        user.testsTaken = (user.testsTaken || 0) + 1;
        user.totalStudyTime = (user.totalStudyTime || 0) + Math.floor((timeSpent || 0) / 1000);
        user.scores.push({ course: courseCode, score: correct, totalQuestions: questions.length, percentage: pct, mode: 'test' });
        
        await user.save();
        await Notification.create({ user: user._id, title: '🧪 Test Completed!', message: `You scored ${pct}% in ${courseCode}`, type: 'success' });
        
        res.json({ score: pct, correctCount: correct, totalQuestions: questions.length });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// AI Chat - FIXED with correct model name
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        
        console.log('🤖 AI Key exists:', !!apiKey);
        
        if (!apiKey) {
            return res.json({ reply: 'AI service not configured. Please add GEMINI_API_KEY to Render environment variables.' });
        }
        
        // Use the correct model name: gemini-1.5-flash or gemini-pro
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `You are ExamPlugAI by Francistech, an educational assistant for OAU students. Be helpful and concise. User: ${message}` }] }]
            })
        });
        
        const data = await response.json();
        console.log('📡 Gemini status:', response.status);
        
        if (!response.ok) {
            console.error('❌ Gemini error:', data.error?.message || 'Unknown error');
            return res.json({ reply: `AI Error: ${data.error?.message || 'Invalid API key or model'}. Please check your API key.` });
        }
        
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';
        res.json({ reply });
        
    } catch (e) {
        console.error('❌ AI Exception:', e.message);
        res.json({ reply: `AI service error: ${e.message}` });
    }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        await seedDatabase();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Leaderboard: /api/users/leaderboard`);
            console.log(`🤖 AI Chat: /api/ai/chat`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB error:', err.message);
    });
