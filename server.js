const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'OAU Exam Plug API', status: 'running', version: '4.0.0' }));
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ==================== 14 FACULTIES ====================
const FACULTIES = [
    'Agriculture', 'Arts', 'Law', 'Science', 'Social Sciences',
    'Education', 'Pharmacy', 'Technology', 'Administration',
    'Environmental Design and Management', 'Basic Medical Sciences',
    'Clinical Sciences', 'Dentistry', 'Computing'
];

// ==================== MODELS ====================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, sparse: true },
    password: { type: String, required: true },
    faculty: { type: String, required: true, enum: FACULTIES },
    department: { type: String, required: true },
    level: { type: String, required: true, default: '100' },
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
    courseName: String,
    faculty: { type: String, required: true },
    level: { type: String, required: true },
    semester: { type: String },
    mode: { type: String, default: 'exam' },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true },
    explanation: String,
    difficulty: { type: String, default: 'medium' },
    createdAt: { type: Date, default: Date.now }
});

const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

const testQuestionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true },
    courseName: String,
    faculty: { type: String, required: true },
    level: { type: String, required: true },
    semester: { type: String },
    mode: { type: String, default: 'test' },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true },
    explanation: String,
    hint: String,
    difficulty: { type: String, default: 'medium' },
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

// ==================== 100 LEVEL COURSES ====================
const COURSES_100 = {
    'Agriculture': { first: ['AGR 101', 'AGR 103', 'GST 111'], second: ['AGR 102', 'AGR 104', 'GST 112'] },
    'Arts': { first: ['ENG 101', 'PHL 101', 'GST 111'], second: ['ENG 102', 'PHL 102', 'GST 112'] },
    'Law': { first: ['JIL 101', 'GST 111'], second: ['JIL 102', 'GST 112'] },
    'Science': { first: ['BIO 101', 'CHM 101', 'MTH 101', 'PHY 101', 'GST 111'], second: ['BIO 102', 'CHM 102', 'MTH 102', 'PHY 102', 'GST 112'] },
    'Social Sciences': { first: ['ECO 101', 'POL 101', 'SOC 101', 'GST 111'], second: ['ECO 102', 'POL 102', 'SOC 102', 'GST 112'] },
    'Education': { first: ['EDU 101', 'EDC 101', 'GST 111'], second: ['EDU 102', 'EDC 102', 'GST 112'] },
    'Pharmacy': { first: ['PCL 101', 'PCH 101', 'GST 111'], second: ['PCL 102', 'PCH 102', 'GST 112'] },
    'Technology': { first: ['CHM 101', 'MTH 101', 'PHY 101', 'PHY 103', 'GST 111'], second: ['CHM 102', 'MTH 102', 'PHY 102', 'PHY 104', 'GST 112'] },
    'Administration': { first: ['BUS 101', 'ACC 101', 'GST 111'], second: ['BUS 102', 'ACC 102', 'GST 112'] },
    'Environmental Design and Management': { first: ['ARC 101', 'URP 101', 'GST 111'], second: ['ARC 102', 'URP 102', 'GST 112'] },
    'Basic Medical Sciences': { first: ['ANA 101', 'PHS 101', 'BCH 101', 'GST 111'], second: ['ANA 102', 'PHS 102', 'BCH 102', 'GST 112'] },
    'Clinical Sciences': { first: ['MED 101', 'SUR 101', 'GST 111'], second: ['MED 102', 'SUR 102', 'GST 112'] },
    'Dentistry': { first: ['DEN 101', 'ORA 101', 'GST 111'], second: ['DEN 102', 'ORA 102', 'GST 112'] },
    'Computing': { first: ['CSC 101', 'MTH 101', 'PHY 101', 'GST 111'], second: ['CSC 102', 'MTH 102', 'PHY 102', 'GST 112'] }
};

const COURSE_NAMES = {
    'GST 111': 'Use of English I', 'GST 112': 'Use of English II',
    'AGR 101': 'Intro to Agriculture', 'AGR 102': 'Principles of Agriculture', 'AGR 103': 'Soil Science', 'AGR 104': 'Crop Production',
    'ENG 101': 'Intro to Literature', 'ENG 102': 'Advanced Literature', 'PHL 101': 'Intro to Philosophy', 'PHL 102': 'Logic',
    'JIL 101': 'Legal Methods', 'JIL 102': 'Nigerian Legal System',
    'BIO 101': 'General Biology I', 'BIO 102': 'General Biology II',
    'CHM 101': 'General Chemistry I', 'CHM 102': 'General Chemistry II',
    'MTH 101': 'Elementary Math I', 'MTH 102': 'Elementary Math II',
    'PHY 101': 'General Physics I', 'PHY 102': 'General Physics II', 'PHY 103': 'Physics for Eng I', 'PHY 104': 'Physics for Eng II',
    'ECO 101': 'Principles of Economics I', 'ECO 102': 'Principles of Economics II',
    'POL 101': 'Intro to Politics', 'POL 102': 'Political Theory', 'SOC 101': 'Intro to Sociology', 'SOC 102': 'Social Structure',
    'EDU 101': 'Intro to Education', 'EDU 102': 'Educational Psychology', 'EDC 101': 'Curriculum Studies', 'EDC 102': 'Instructional Methods',
    'PCL 101': 'Intro to Pharmacy', 'PCL 102': 'Pharmacy Practice', 'PCH 101': 'Pharmaceutical Chemistry I', 'PCH 102': 'Pharmaceutical Chemistry II',
    'BUS 101': 'Intro to Business', 'BUS 102': 'Business Environment', 'ACC 101': 'Intro to Accounting', 'ACC 102': 'Financial Accounting',
    'ARC 101': 'Intro to Architecture', 'ARC 102': 'Architectural Design', 'URP 101': 'Intro to Urban Planning', 'URP 102': 'Planning Theory',
    'ANA 101': 'Gross Anatomy I', 'ANA 102': 'Gross Anatomy II', 'PHS 101': 'Physiology I', 'PHS 102': 'Physiology II', 'BCH 101': 'Biochemistry I', 'BCH 102': 'Biochemistry II',
    'MED 101': 'Intro to Medicine', 'MED 102': 'Medical Ethics', 'SUR 101': 'Intro to Surgery', 'SUR 102': 'Surgical Principles',
    'DEN 101': 'Intro to Dentistry', 'DEN 102': 'Dental Anatomy', 'ORA 101': 'Oral Biology', 'ORA 102': 'Oral Histology',
    'CSC 101': 'Intro to Computing', 'CSC 102': 'Programming Fundamentals'
};

// ==================== FORCE CLEAR USERS (Comment out after first deploy) ====================
async function forceClearUsers() {
    try {
        await User.deleteMany({});
        await Notification.deleteMany({});
        console.log('✅ Database cleared - Fresh start!');
    } catch (e) { console.error('Clear error:', e.message); }
}

// ==================== SEED QUESTIONS ====================
async function seedQuestions() {
    try {
        const count = await ExamQuestion.countDocuments();
        if (count > 0) return;

        for (const faculty of FACULTIES) {
            const courses = COURSES_100[faculty] || { first: ['GST 111'], second: ['GST 112'] };
            for (const semester of ['first', 'second']) {
                for (const courseCode of courses[semester] || []) {
                    await ExamQuestion.create([
                        { courseCode, courseName: COURSE_NAMES[courseCode] || courseCode, faculty, level: '100', semester, mode: 'exam', text: `${courseCode}: What is the primary focus of ${COURSE_NAMES[courseCode] || 'this course'}?`, options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'], correctOption: 0, explanation: 'This is a foundational concept in the course.', difficulty: 'easy' },
                        { courseCode, courseName: COURSE_NAMES[courseCode] || courseCode, faculty, level: '100', semester, mode: 'exam', text: `${courseCode}: Which of the following is correct?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 1, explanation: 'Refer to your course materials for verification.', difficulty: 'medium' },
                        { courseCode, courseName: COURSE_NAMES[courseCode] || courseCode, faculty, level: '100', semester, mode: 'exam', text: `${courseCode}: Identify the correct statement.`, options: ['Statement A', 'Statement B', 'Statement C', 'Statement D'], correctOption: 2, explanation: 'This is based on standard curriculum.', difficulty: 'hard' }
                    ]);
                    await TestQuestion.create([
                        { courseCode, courseName: COURSE_NAMES[courseCode] || courseCode, faculty, level: '100', semester, mode: 'test', text: `${courseCode}: Practice question - ${COURSE_NAMES[courseCode] || ''}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0, hint: 'Review the basics of this topic.', explanation: 'Practice helps reinforce learning.', difficulty: 'easy' },
                        { courseCode, courseName: COURSE_NAMES[courseCode] || courseCode, faculty, level: '100', semester, mode: 'test', text: `${courseCode}: Another practice question`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 1, hint: 'Consider all possibilities before answering.', explanation: 'Keep practicing!', difficulty: 'medium' }
                    ]);
                }
            }
        }
        console.log('✅ Questions seeded for all 14 faculties (100 Level)');
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
            fullName, username, email, password: hashed, faculty, department, level: level || '100',
            securityQuestion, securityAnswer: securityAnswer?.toLowerCase(),
            currentStreak: 1, lastActive: new Date()
        });
        
        await Notification.create({ user: user._id, title: '🎉 Welcome to OAU Exam Plug!', message: `Welcome ${fullName}! Your journey to academic excellence starts now. Start practicing today!`, type: 'success' });
        
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
                await Notification.create({ user: user._id, title: '🏆 Achievement Unlocked!', message: 'Week Warrior: You studied for 7 consecutive days!', type: 'achievement' });
            }
            await user.save();
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/courses', (req, res) => {
    res.json({ courses: COURSES_100, courseNames: COURSE_NAMES, faculties: FACULTIES });
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
        }).filter(u => u.examsTaken > 0 || u.testsTaken > 0).sort((a, b) => b.overallAvg - a.overallAvg);
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
        
        if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        
        const user = await User.findById(decoded.id);
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
        
        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();
        res.json({ success: true, message: 'Password changed successfully!' });
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
            user.achievements.push({ name: 'First Exam', description: 'Completed your first exam!' });
            await Notification.create({ user: user._id, title: '🏆 First Exam!', message: 'You completed your first exam! Keep going!', type: 'achievement' });
        }
        if (pct >= 90) {
            user.achievements.push({ name: 'Excellence', description: 'Scored 90% or above!' });
            await Notification.create({ user: user._id, title: '🏆 Excellence!', message: `Amazing! You scored ${pct}% in ${courseCode}!`, type: 'achievement' });
        }
        
        await user.save();
        await Notification.create({ user: user._id, title: '📝 Exam Completed!', message: `You scored ${pct}% in ${courseCode}. ${correct}/${questions.length} correct.`, type: 'success' });
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
        await Notification.create({ user: user._id, title: '🧪 Test Completed!', message: `You scored ${pct}% in ${courseCode} test. ${correct}/${questions.length} correct.`, type: 'success' });
        res.json({ score: pct, correctCount: correct, totalQuestions: questions.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('faculty') || lowerMsg.includes('faculties')) {
            return res.json({ reply: `OAU has 14 faculties: ${FACULTIES.join(', ')}. 100 level courses are available now!` });
        }
        if (lowerMsg.includes('course') || lowerMsg.includes('courses')) {
            return res.json({ reply: '100 level courses include GST 111, GST 112, and faculty-specific courses like CHM 101, MTH 101, PHY 101, BIO 101, CSC 101, and more! 200-500 level coming soon.' });
        }
        if (lowerMsg.includes('study') || lowerMsg.includes('tip')) {
            return res.json({ reply: '📚 Study Tips: Use active recall (test yourself), spaced repetition (review at intervals), take 15-min breaks every hour, and get 7-8 hours of sleep before exams!' });
        }
        if (lowerMsg.includes('exam') || lowerMsg.includes('test')) {
            return res.json({ reply: 'You can take timed exams (50 min) or practice tests (40 min) with hints. Your scores are tracked on your dashboard and leaderboard!' });
        }
        if (lowerMsg.includes('streak') || lowerMsg.includes('daily')) {
            return res.json({ reply: 'Complete at least one exam or test each day to maintain your streak. Streaks reset after 24 hours of inactivity. Week-long streaks earn achievements!' });
        }
        if (lowerMsg.includes('achievement') || lowerMsg.includes('badge')) {
            return res.json({ reply: 'Earn achievements by completing exams, maintaining streaks, and scoring high marks. Check your profile to see your badges!' });
        }
        
        res.json({ reply: "I'm ExamPlugAI by Francistech! I can help with study tips, course information, exam strategies, and more. What would you like to know?" });
    } catch (e) { res.json({ reply: "I'm here to help! Ask me anything about your studies." }); }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        // await forceClearUsers(); // Uncomment to clear database on deploy
        await seedQuestions();
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}\n📚 14 Faculties | 100 Level Active | 200+ Coming Soon`));
    })
    .catch(e => console.error('❌ MongoDB error:', e.message));
