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

// AI Knowledge Base - Learns from questions
const aiKnowledgeSchema = new mongoose.Schema({
    topic: String,
    keywords: [String],
    response: String,
    usageCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const AIKnowledge = mongoose.model('AIKnowledge', aiKnowledgeSchema);

// ==================== FORCE CLEAR ALL USERS ON START ====================
async function forceClearUsers() {
    try {
        await User.deleteMany({});
        await Notification.deleteMany({});
        console.log('✅ ALL USERS CLEARED - Fresh database!');
    } catch (e) { console.error('Clear users error:', e.message); }
}

// ==================== SEED QUESTIONS & AI KNOWLEDGE ====================
async function seedData() {
    try {
        // Seed Questions
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
            { code: 'BIO 102', name: 'General Biology II', faculty: 'Science', level: '100', semester: 'second' }
        ];

        for (const c of courses) {
            const exists = await ExamQuestion.findOne({ courseCode: c.code });
            if (!exists) {
                await ExamQuestion.create([
                    { courseCode: c.code, faculty: c.faculty, level: c.level, semester: c.semester, mode: 'exam', text: `${c.code}: What is the main concept of ${c.name}?`, options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'], correctOption: 0, explanation: `This is a fundamental concept in ${c.name}.` },
                    { courseCode: c.code, faculty: c.faculty, level: c.level, semester: c.semester, mode: 'exam', text: `${c.code}: Which formula is correct?`, options: ['A = B + C', 'X = Y - Z', 'P = Q × R', 'All of the above'], correctOption: 2, explanation: 'The correct formula is P = Q × R.' }
                ]);
                await TestQuestion.create([
                    { courseCode: c.code, faculty: c.faculty, level: c.level, semester: c.semester, mode: 'test', text: `${c.code}: Practice question for ${c.name}`, options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], correctOption: 0, hint: 'Review the basics', explanation: 'Sample explanation.' }
                ]);
            }
        }

        // Seed AI Knowledge Base
        const aiKnowledgeCount = await AIKnowledge.countDocuments();
        if (aiKnowledgeCount === 0) {
            await AIKnowledge.create([
                { topic: 'Chemistry', keywords: ['chemistry', 'chem', 'chm', 'reaction', 'molecule', 'atom', 'element', 'periodic'], response: 'Chemistry is the study of matter, its properties, and how substances combine or separate. Key topics include atomic structure, chemical bonding, stoichiometry, and organic chemistry. Practice balancing equations and understanding the periodic table.' },
                { topic: 'Mathematics', keywords: ['math', 'maths', 'mth', 'calculus', 'algebra', 'equation', 'formula', 'derivative', 'integral'], response: 'Mathematics involves numbers, quantities, and shapes. Focus on understanding concepts rather than memorization. Practice problems daily, especially in calculus, algebra, and statistics.' },
                { topic: 'Physics', keywords: ['physics', 'phy', 'motion', 'force', 'energy', 'velocity', 'acceleration', 'newton', 'quantum'], response: 'Physics explains how the universe behaves. Key areas include mechanics, thermodynamics, electromagnetism, and optics. Draw diagrams and understand the fundamental laws.' },
                { topic: 'GST', keywords: ['gst', 'general studies', 'english', 'communication', 'nigeria', 'history', 'current affairs'], response: 'GST (General Studies) covers Nigerian history, current affairs, English language, and communication skills. Stay updated with news and practice essay writing.' },
                { topic: 'Study Tips', keywords: ['study', 'learn', 'exam', 'test', 'prepare', 'revision', 'memory', 'focus', 'concentration'], response: 'Effective study techniques: Active recall (test yourself), spaced repetition (review at intervals), Pomodoro technique (25 min study, 5 min break), teach others, and get adequate sleep before exams.' },
                { topic: 'Exam Strategy', keywords: ['exam', 'test', 'strategy', 'time management', 'cbt', 'preparation'], response: 'Exam strategies: Read all questions first, answer easy ones immediately, manage your time (divide total time by number of questions), review your answers if time permits, and stay calm.' },
                { topic: 'Biology', keywords: ['bio', 'biology', 'cell', 'organism', 'genetics', 'evolution', 'ecology'], response: 'Biology is the study of living organisms. Key topics include cell biology, genetics, evolution, ecology, and human anatomy. Use diagrams to visualize processes.' }
            ]);
            console.log('✅ AI Knowledge base seeded');
        }

        console.log('✅ Questions seeded');
    } catch (e) { console.error('Seed error:', e.message); }
}

// ==================== DYNAMIC AI FUNCTION ====================
async function getAIResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    // 1. Check local knowledge base first (learned from app)
    const knowledge = await AIKnowledge.find({});
    let bestMatch = null;
    let highestScore = 0;
    
    for (const k of knowledge) {
        let score = 0;
        for (const keyword of k.keywords) {
            if (lowerMsg.includes(keyword.toLowerCase())) {
                score += 10;
            }
        }
        // Check individual words
        const words = lowerMsg.split(/\s+/);
        for (const word of words) {
            if (k.keywords.some(kw => kw.toLowerCase().includes(word) || word.includes(kw.toLowerCase()))) {
                score += 5;
            }
        }
        if (score > highestScore) {
            highestScore = score;
            bestMatch = k;
        }
    }
    
    if (bestMatch && highestScore >= 10) {
        bestMatch.usageCount = (bestMatch.usageCount || 0) + 1;
        await bestMatch.save();
        return bestMatch.response;
    }
    
    // 2. Try FREE AI APIs (multiple fallbacks)
    
    // Try Hugging Face Inference API (FREE)
    try {
        const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inputs: `<s>[INST] You are ExamPlugAI, an educational assistant for OAU students. Be helpful and concise. User: ${message} [/INST]`,
                parameters: { max_new_tokens: 150, temperature: 0.7 }
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data[0]?.generated_text) {
                let reply = data[0].generated_text.split('[/INST]')[1]?.trim() || data[0].generated_text;
                return reply;
            }
        }
    } catch (e) { console.log('Hugging Face unavailable, trying next...'); }
    
    // 3. Try OpenRouter FREE models
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-or-v1-free-' // Free tier works without full key
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [{ role: 'user', content: `You are ExamPlugAI by Francistech, an educational assistant for OAU students. User: ${message}` }]
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.choices[0].message.content;
        }
    } catch (e) { console.log('OpenRouter unavailable, using smart fallback...'); }
    
    // 4. Smart Pattern-Matching Fallback
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
        return "Hello! I'm ExamPlugAI by Francistech. I can help with Chemistry, Math, Physics, Biology, GST, study tips, and exam strategies. What would you like to learn about?";
    }
    if (lowerMsg.includes('help')) {
        return "I can help you with: 📚 Course content (Chemistry, Math, Physics, Biology, GST), 📝 Study tips and exam strategies, ❓ Answering specific questions, 🎯 Practice recommendations. What do you need help with?";
    }
    if (lowerMsg.includes('thank')) {
        return "You're welcome! Keep studying hard. Excellence is a habit. Is there anything else I can help with?";
    }
    if (lowerMsg.includes('who are you') || lowerMsg.includes('what are you')) {
        return "I'm ExamPlugAI, an intelligent educational assistant created by Francistech for OAU Exam Plug. I learn from the app's content and can help you with your studies, exam preparation, and answering subject-related questions.";
    }
    if (lowerMsg.includes('how to') || lowerMsg.includes('tips')) {
        return "Here's a helpful approach: Break down the problem into smaller parts, practice regularly, and don't hesitate to review fundamentals. For specific subjects, ask me about Chemistry, Math, Physics, or GST.";
    }
    
    // Extract course code if mentioned
    const courseMatch = lowerMsg.match(/([a-z]{3}\s?\d{3})/i);
    if (courseMatch) {
        const courseCode = courseMatch[1].toUpperCase();
        const questions = await ExamQuestion.find({ courseCode }).limit(3);
        if (questions.length > 0) {
            return `I found some ${courseCode} topics: ${questions.map(q => q.text.substring(0, 50)).join('; ')}... Would you like me to explain any of these concepts?`;
        }
        return `${courseCode} is in our database. Ask me specific questions about this course!`;
    }
    
    // Default response with context
    return "That's an interesting question! I'm continuously learning from the OAU Exam Plug content. Could you provide more details or ask about a specific subject (Chemistry, Math, Physics, Biology, GST) or study technique?";
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

// DYNAMIC AI ENDPOINT
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const reply = await getAIResponse(message);
        res.json({ reply });
    } catch (e) {
        res.json({ reply: "I'm here to help! Ask me about your courses, study tips, or exam strategies." });
    }
});

// Admin: Add AI Knowledge (for learning)
app.post('/api/admin/ai-knowledge', async (req, res) => {
    try {
        const { topic, keywords, response } = req.body;
        const knowledge = await AIKnowledge.create({ topic, keywords, response });
        res.json({ success: true, knowledge });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        await forceClearUsers();
        await seedData();
        app.listen(PORT, () => console.log(`🚀 Server on ${PORT}\n🤖 Dynamic AI ready!`));
    })
    .catch(e => console.error('❌ MongoDB error:', e.message));
