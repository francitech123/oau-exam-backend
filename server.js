const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'OAU Exam Plug API', status: 'running', version: '2.0.0' }));
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
    courseCode: String, faculty: String, level: String, semester: String,
    mode: { type: String, default: 'exam' }, text: String, options: [String],
    correctOption: Number, explanation: String, difficulty: { type: String, default: 'medium' }
});

const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

const testQuestionSchema = new mongoose.Schema({
    courseCode: String, faculty: String, level: String, semester: String,
    mode: { type: String, default: 'test' }, text: String, options: [String],
    correctOption: Number, explanation: String, hint: String, difficulty: { type: String, default: 'medium' }
});

const TestQuestion = mongoose.model('TestQuestion', testQuestionSchema);

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String, message: String, type: { type: String, enum: ['success', 'info', 'warning', 'achievement'] },
    read: { type: Boolean, default: false }, createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// ==================== FORCE CLEAR ALL USERS ON START ====================
async function forceClearUsers() {
    try {
        await User.deleteMany({});
        await Notification.deleteMany({});
        console.log('✅ ALL USERS CLEARED - Fresh database!');
    } catch (e) { console.error('Clear users error:', e.message); }
}

// ==================== SEED QUESTIONS ONLY ====================
async function seedQuestions() {
    try {
        const courses = [
            { code: 'CHM 101', name: 'General Chemistry I', faculty: 'Technology', level: '100', semester: 'first' },
            { code: 'CHM 102', name: 'General Chemistry II', faculty: 'Technology', level: '100', semester: 'second' },
            { code: 'MTH 101', name: 'Elementary Math I', faculty: 'Technology', level: '100', semester: 'first' },
            { code: 'MTH 102', name: 'Elementary Math II', faculty: 'Technology', level: '100', semester: 'second' },
            { code: 'PHY 101', name: 'General Physics I', faculty: 'Technology', level: '100', semester: 'first' },
            { code: 'PHY 102', name: 'General Physics II', faculty: 'Technology', level: '100', semester: 'second' },
            { code: 'PHY 103', name: 'Physics for Eng I', faculty: 'Technology', level: '100', semester: 'first' },
            { code: 'PHY 104', name: 'Physics for Eng II', faculty: 'Technology', level: '100', semester: 'second' },
            { code: 'GST 111', name: 'Use of English I', faculty: 'Technology', level: '100', semester: 'first' },
            { code: 'GST 112', name: 'Use of English II', faculty: 'Technology', level: '100', semester: 'second' },
            { code: 'BIO 101', name: 'General Biology I', faculty: 'Science', level: '100', semester: 'first' },
            { code: 'BIO 102', name: 'General Biology II', faculty: 'Science', level: '100', semester: 'second' },
            { code: 'CSC 201', name: 'Computer Programming I', faculty: 'Technology', level: '200', semester: 'first' },
            { code: 'CSC 202', name: 'Computer Programming II', faculty: 'Technology', level: '200', semester: 'second' },
            { code: 'EEE 301', name: 'Circuit Theory I', faculty: 'Technology', level: '300', semester: 'first' },
            { code: 'EEE 302', name: 'Circuit Theory II', faculty: 'Technology', level: '300', semester: 'second' },
            { code: 'MEE 401', name: 'Thermodynamics I', faculty: 'Technology', level: '400', semester: 'first' },
            { code: 'MEE 402', name: 'Thermodynamics II', faculty: 'Technology', level: '400', semester: 'second' },
            { code: 'CHE 501', name: 'Reactor Design I', faculty: 'Technology', level: '500', semester: 'first' },
            { code: 'CHE 502', name: 'Reactor Design II', faculty: 'Technology', level: '500', semester: 'second' }
        ];

        for (const c of courses) {
            const exists = await ExamQuestion.findOne({ courseCode: c.code });
            if (!exists) {
                await ExamQuestion.create([
                    { courseCode: c.code, faculty: c.faculty, level: c.level, semester: c.semester, mode: 'exam', text: `${c.code}: Sample exam question 1`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0, explanation: 'Sample explanation' },
                    { courseCode: c.code, faculty: c.faculty, level: c.level, semester: c.semester, mode: 'exam', text: `${c.code}: Sample exam question 2`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 1, explanation: 'Sample explanation' },
                    { courseCode: c.code, faculty: c.faculty, level: c.level, semester: c.semester, mode: 'exam', text: `${c.code}: Sample exam question 3`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 2, explanation: 'Sample explanation' }
                ]);
                await TestQuestion.create([
                    { courseCode: c.code, faculty: c.faculty, level: c.level, semester: c.semester, mode: 'test', text: `${c.code}: Sample test question 1`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0, hint: 'Think carefully', explanation: 'Sample explanation' },
                    { courseCode: c.code, faculty: c.faculty, level: c.level, semester: c.semester, mode: 'test', text: `${c.code}: Sample test question 2`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 1, hint: 'Consider all options', explanation: 'Sample explanation' }
                ]);
            }
        }
        console.log('✅ Questions seeded');
    } catch (e) { console.error('Seed error:', e.message); }
}

// ==================== ROUTES ====================

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
        
        await Notification.create({ user: user._id, title: '🎉 Welcome!', message: `Welcome ${fullName}! Start practicing today.`, type: 'success' });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid username or password' });
        
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
        Science: {
            100: { first: ['BIO 101', 'CHM 101', 'MTH 101', 'PHY 101', 'GST 111'], second: ['BIO 102', 'CHM 102', 'MTH 102', 'PHY 102', 'GST 112'] }
        },
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
                id: u._id, name: u.username, examsTaken: u.examsTaken || 0, testsTaken: u.testsTaken || 0,
                overallAvg: avg, achievements: (u.achievements || []).length, registeredDate: u.createdAt || new Date()
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
        const notifs = await Notification.find({ user: decoded.id }).sort({ createdAt: -1 }).limit(50);
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
    } catch (e) { res.status(500).json({ error: e.message }); }
});

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
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
        
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
            questions = [{ text: 'Sample Question', options: ['A', 'B', 'C', 'D'], correctOption: 0, explanation: 'Sample' }];
        }
        res.json({ sessionId: Date.now().toString(), course: courseCode, mode: 'exam', timeLimit: 50, questions });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tests/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        let questions = await TestQuestion.find({ courseCode, mode: 'test' }).limit(30);
        if (!questions.length) {
            questions = [{ text: 'Sample Test', options: ['A', 'B', 'C', 'D'], correctOption: 0, hint: 'Think', explanation: 'Sample' }];
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
            await Notification.create({ user: user._id, title: '🏆 Achievement!', message: 'First Exam completed!', type: 'achievement' });
        }
        if (pct >= 90) {
            user.achievements.push({ name: 'Excellence', description: 'Scored 90%+' });
            await Notification.create({ user: user._id, title: '🏆 Excellence!', message: '90%+ score!', type: 'achievement' });
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

// FREE AI - No API Key Required!
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const lowerMsg = message.toLowerCase();
        
        const responses = {
            hello: "Hello! I'm ExamPlugAI by Francistech. How can I help with your studies today?",
            hi: "Hi there! Ready to ace your exams? Ask me anything about your courses!",
            help: "I can help with: study tips, course explanations, exam strategies, and answering subject questions. What do you need?",
            exam: "For exams: Practice past questions, manage your time, read questions carefully, and stay calm. You've got this!",
            study: "Effective study tips: Use active recall, spaced repetition, teach others, take breaks, and sleep well before exams.",
            chemistry: "Chemistry tip: Understand the periodic table trends, practice balancing equations, and memorize key formulas.",
            math: "Math tip: Practice problems daily, understand concepts not just memorization, and show all your work.",
            physics: "Physics tip: Draw diagrams, understand units, and practice applying formulas to different scenarios.",
            english: "English tip: Read widely, practice writing essays, and learn new vocabulary daily.",
            gst: "GST (General Studies): Focus on current affairs, Nigerian history, and communication skills.",
            thanks: "You're welcome! Keep studying hard. Excellence is a habit!",
            bye: "Goodbye! Remember: consistent practice leads to success. See you next time!"
        };
        
        let reply = "I'm ExamPlugAI by Francistech! I can help with study tips, exam strategies, Chemistry, Math, Physics, English, and GST. What would you like to learn about?";
        
        for (const [key, value] of Object.entries(responses)) {
            if (lowerMsg.includes(key)) { reply = value; break; }
        }
        
        res.json({ reply });
    } catch (e) { res.json({ reply: "I'm here to help! Ask me anything about your studies." }); }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        await forceClearUsers(); // FORCE CLEAR ALL USERS
        await seedQuestions();
        app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
    })
    .catch(e => console.error('❌ MongoDB error:', e.message));
