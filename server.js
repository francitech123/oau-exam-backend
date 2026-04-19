const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'OAU Exam Plug API', status: 'running', version: '3.0.0' }));
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ==================== MODELS ====================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, sparse: true },
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
    courseCode: { type: String, required: true },
    faculty: { type: String, required: true },
    level: { type: String, required: true },
    semester: { type: String, required: true },
    mode: { type: String, default: 'exam' },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    createdAt: { type: Date, default: Date.now }
});

const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

const testQuestionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true },
    faculty: { type: String, required: true },
    level: { type: String, required: true },
    semester: { type: String, required: true },
    mode: { type: String, default: 'test' },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true },
    explanation: { type: String, default: '' },
    hint: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    createdAt: { type: Date, default: Date.now }
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

const aiKnowledgeSchema = new mongoose.Schema({
    topic: String,
    keywords: [String],
    response: String,
    usageCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const AIKnowledge = mongoose.model('AIKnowledge', aiKnowledgeSchema);

// ==================== ADMIN MIDDLEWARE ====================
async function adminAuth(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id);
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        req.user = user;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// ==================== FORCE CLEAR USERS ====================
async function forceClearUsers() {
    try {
        await User.deleteMany({});
        await Notification.deleteMany({});
        
        // Create admin user
        const hashed = await bcrypt.hash('admin123', 12);
        await User.create({
            fullName: 'Administrator',
            username: 'admin',
            email: 'admin@oauexamplug.com',
            password: hashed,
            faculty: 'Technology',
            department: 'Admin',
            level: '500',
            isAdmin: true,
            securityQuestion: 'pet',
            securityAnswer: 'admin'
        });
        
        console.log('✅ Admin created: admin / admin123');
        console.log('✅ All other users cleared!');
    } catch (e) { console.error('Clear users error:', e.message); }
}

// ==================== SEED DATA ====================
async function seedData() {
    try {
        // Seed AI Knowledge
        const aiCount = await AIKnowledge.countDocuments();
        if (aiCount === 0) {
            await AIKnowledge.create([
                { topic: 'Chemistry', keywords: ['chemistry', 'chem', 'chm', 'reaction', 'molecule', 'atom', 'element', 'periodic'], response: 'Chemistry is the study of matter. Key topics: atomic structure, chemical bonding, stoichiometry, and organic chemistry.' },
                { topic: 'Mathematics', keywords: ['math', 'maths', 'mth', 'calculus', 'algebra', 'equation', 'formula', 'derivative', 'integral'], response: 'Mathematics involves numbers and logic. Practice problems daily in calculus, algebra, and statistics.' },
                { topic: 'Physics', keywords: ['physics', 'phy', 'motion', 'force', 'energy', 'velocity', 'acceleration', 'newton'], response: 'Physics explains how the universe behaves. Key areas: mechanics, thermodynamics, electromagnetism.' },
                { topic: 'GST', keywords: ['gst', 'general studies', 'english', 'communication', 'nigeria', 'history'], response: 'GST covers Nigerian history, current affairs, English language, and communication skills.' },
                { topic: 'Study Tips', keywords: ['study', 'learn', 'exam', 'test', 'prepare', 'revision', 'memory', 'focus'], response: 'Effective study: Active recall, spaced repetition, Pomodoro technique (25 min study, 5 min break), and teach others.' }
            ]);
            console.log('✅ AI Knowledge seeded');
        }
    } catch (e) { console.error('Seed error:', e.message); }
}

// ==================== DYNAMIC AI ====================
async function getAIResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    const knowledge = await AIKnowledge.find({});
    let bestMatch = null;
    let highestScore = 0;
    
    for (const k of knowledge) {
        let score = 0;
        for (const keyword of k.keywords) {
            if (lowerMsg.includes(keyword.toLowerCase())) score += 10;
        }
        const words = lowerMsg.split(/\s+/);
        for (const word of words) {
            if (k.keywords.some(kw => kw.toLowerCase().includes(word) || word.includes(kw.toLowerCase()))) score += 5;
        }
        if (score > highestScore) { highestScore = score; bestMatch = k; }
    }
    
    if (bestMatch && highestScore >= 10) {
        bestMatch.usageCount = (bestMatch.usageCount || 0) + 1;
        await bestMatch.save();
        return bestMatch.response;
    }
    
    // Smart fallbacks
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) return "Hello! I'm ExamPlugAI by Francistech. How can I help with your studies?";
    if (lowerMsg.includes('help')) return "I can help with: 📚 Course content, 📝 Study tips, ❓ Answering questions. What do you need?";
    if (lowerMsg.includes('thank')) return "You're welcome! Keep studying hard!";
    if (lowerMsg.includes('who are you')) return "I'm ExamPlugAI, created by Francistech for OAU Exam Plug.";
    
    const courseMatch = lowerMsg.match(/([a-z]{3}\s?\d{3})/i);
    if (courseMatch) {
        const code = courseMatch[1].toUpperCase();
        const questions = await ExamQuestion.find({ courseCode: code }).limit(3);
        if (questions.length > 0) return `I found ${code} topics: ${questions.map(q => q.text.substring(0, 50)).join('; ')}...`;
        return `${code} is available. Ask me specific questions!`;
    }
    
    return "I'm here to help with your studies! Ask about Chemistry, Math, Physics, GST, or study tips.";
}

// ==================== PUBLIC ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, email, password, faculty, department, level, securityQuestion, securityAnswer } = req.body;
        
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        if (!/[A-Z]/.test(password)) return res.status(400).json({ error: 'Password must contain uppercase letter' });
        if (!/[0-9]/.test(password)) return res.status(400).json({ error: 'Password must contain number' });
        
        const exists = await User.findOne({ username });
        if (exists) return res.status(400).json({ error: 'Username already taken' });
        
        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({
            fullName, username, email, password: hashed, faculty, department, level,
            securityQuestion, securityAnswer: securityAnswer?.toLowerCase(),
            currentStreak: 1, lastActive: new Date()
        });
        
        await Notification.create({ user: user._id, title: '🎉 Welcome!', message: `Welcome ${fullName}!`, type: 'success' });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });
        
        const today = new Date().toDateString();
        const last = user.lastActive?.toDateString();
        if (last !== today) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            user.currentStreak = (last === yesterday.toDateString()) ? (user.currentStreak || 0) + 1 : 1;
            user.lastActive = new Date();
            
            if (user.currentStreak === 7) {
                user.achievements.push({ name: 'Week Warrior', description: '7-day streak!' });
                await Notification.create({ user: user._id, title: '🏆 Achievement!', message: 'Week Warrior!', type: 'achievement' });
            }
            await user.save();
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/courses', (req, res) => {
    res.json({ courses: {
        Technology: { 
            100: { first: ['CHM 101', 'MTH 101', 'PHY 101', 'PHY 103', 'GST 111'], second: ['CHM 102', 'MTH 102', 'PHY 102', 'PHY 104', 'GST 112'] },
            200: { first: ['CSC 201'], second: ['CSC 202'] },
            300: { first: ['EEE 301'], second: ['EEE 302'] },
            400: { first: ['MEE 401'], second: ['MEE 402'] },
            500: { first: ['CHE 501'], second: ['CHE 502'] }
        },
        Science: { 100: { first: ['BIO 101', 'CHM 101', 'MTH 101', 'PHY 101', 'GST 111'], second: ['BIO 102', 'CHM 102', 'MTH 102', 'PHY 102', 'GST 112'] } },
        Arts: { 100: { first: ['GST 111'], second: ['GST 112'] } },
        Administration: { 100: { first: ['GST 111'], second: ['GST 112'] } }
    }});
});

app.get('/api/users/leaderboard', async (req, res) => {
    try {
        const users = await User.find({}).select('username examsTaken testsTaken scores achievements createdAt').lean();
        const leaderboard = users.map(u => {
            const scores = u.scores || [];
            const avg = scores.length ? Math.round(scores.reduce((a, b) => a + (b.percentage || 0), 0) / scores.length) : 0;
            return {
                name: u.username, examsTaken: u.examsTaken || 0, testsTaken: u.testsTaken || 0,
                overallAvg: avg, achievements: (u.achievements || []).length, registeredDate: u.createdAt
            };
        }).sort((a, b) => b.overallAvg - a.overallAvg);
        res.json({ leaderboard });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users/notifications', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const notifs = await Notification.find({ user: decoded.id }).sort({ createdAt: -1 });
        res.json({ notifications: notifs });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/notifications/read', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        await Notification.updateMany({ user: decoded.id, read: false }, { read: true });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { fullName, email, faculty, department, level, studyGoals } = req.body;
        const user = await User.findById(decoded.id);
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (faculty) user.faculty = faculty;
        if (department) user.department = department;
        if (level) user.level = level;
        if (studyGoals) user.studyGoals = studyGoals;
        await user.save();
        res.json({ success: true, user: { ...user.toObject(), password: undefined } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { currentPassword, newPassword } = req.body;
        
        if (newPassword.length < 8) return res.status(400).json({ error: 'Password too short' });
        
        const user = await User.findById(decoded.id);
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ error: 'Wrong password' });
        
        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/exams/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        let questions = await ExamQuestion.find({ courseCode, mode: 'exam' }).limit(40);
        if (!questions.length) {
            questions = [{ text: 'Sample Question', options: ['A', 'B', 'C', 'D'], correctOption: 0 }];
        }
        res.json({ sessionId: Date.now().toString(), course: courseCode, mode: 'exam', timeLimit: 50, questions });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tests/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        let questions = await TestQuestion.find({ courseCode, mode: 'test' }).limit(30);
        if (!questions.length) {
            questions = [{ text: 'Sample Test', options: ['A', 'B', 'C', 'D'], correctOption: 0, hint: 'Think' }];
        }
        res.json({ sessionId: Date.now().toString(), course: courseCode, mode: 'test', timeLimit: 40, questions });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

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
            user.achievements.push({ name: 'First Exam', description: 'Completed first exam!' });
            await Notification.create({ user: user._id, title: '🏆 Achievement!', message: 'First Exam!', type: 'achievement' });
        }
        
        await user.save();
        await Notification.create({ user: user._id, title: '📝 Exam Done!', message: `${pct}% in ${courseCode}`, type: 'success' });
        res.json({ score: pct, correctCount: correct, totalQuestions: questions.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

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
        await Notification.create({ user: user._id, title: '🧪 Test Done!', message: `${pct}% in ${courseCode}`, type: 'success' });
        res.json({ score: pct, correctCount: correct, totalQuestions: questions.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const reply = await getAIResponse(message);
        res.json({ reply });
    } catch (e) { res.json({ reply: "I'm here to help! Ask me anything about your studies." }); }
});

// ==================== ADMIN ENDPOINTS ====================

// Add Exam Question
app.post('/api/admin/questions/exam', adminAuth, async (req, res) => {
    try {
        const question = await ExamQuestion.create(req.body);
        res.json({ success: true, message: 'Exam question added!', question });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add Test Question
app.post('/api/admin/questions/test', adminAuth, async (req, res) => {
    try {
        const question = await TestQuestion.create(req.body);
        res.json({ success: true, message: 'Test question added!', question });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bulk Add Questions
app.post('/api/admin/questions/bulk', adminAuth, async (req, res) => {
    try {
        const { mode, questions } = req.body;
        const Model = mode === 'exam' ? ExamQuestion : TestQuestion;
        const result = await Model.insertMany(questions);
        res.json({ success: true, message: `${result.length} questions added!` });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get All Questions
app.get('/api/admin/questions/:mode', adminAuth, async (req, res) => {
    try {
        const { mode } = req.params;
        const { courseCode, limit = 100 } = req.query;
        const Model = mode === 'exam' ? ExamQuestion : TestQuestion;
        const query = courseCode ? { courseCode } : {};
        const questions = await Model.find(query).limit(parseInt(limit));
        res.json({ count: questions.length, questions });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Question
app.delete('/api/admin/questions/:mode/:id', adminAuth, async (req, res) => {
    try {
        const { mode, id } = req.params;
        const Model = mode === 'exam' ? ExamQuestion : TestQuestion;
        await Model.findByIdAndDelete(id);
        res.json({ success: true, message: 'Question deleted!' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add AI Knowledge
app.post('/api/admin/ai-knowledge', adminAuth, async (req, res) => {
    try {
        const knowledge = await AIKnowledge.create(req.body);
        res.json({ success: true, message: 'AI knowledge added!', knowledge });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get All Users
app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json({ count: users.length, users });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Clear All Users (except admin)
app.post('/api/admin/clear-users', adminAuth, async (req, res) => {
    try {
        await User.deleteMany({ isAdmin: false });
        await Notification.deleteMany({});
        res.json({ success: true, message: 'All non-admin users cleared!' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        await forceClearUsers();
        await seedData();
        app.listen(PORT, () => {
            console.log(`🚀 Server on ${PORT}`);
            console.log(`📊 Admin login: admin / admin123`);
            console.log(`📋 Admin endpoints: /api/admin/*`);
        });
    })
    .catch(e => console.error('❌ MongoDB error:', e.message));
