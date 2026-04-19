const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// ==================== MODELS ====================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    faculty: { type: String, required: true },
    department: { type: String, required: true },
    level: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    examsTaken: { type: Number, default: 0 },
    testsTaken: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    scores: [{
        course: String,
        score: Number,
        totalQuestions: Number,
        percentage: Number,
        mode: String,
        date: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Exam Question Model
const examQuestionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true },
    mode: { type: String, default: 'exam' },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    isActive: { type: Boolean, default: true }
});

const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

// Test Question Model
const testQuestionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true },
    mode: { type: String, default: 'test' },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true },
    explanation: { type: String, default: '' },
    hint: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    isActive: { type: Boolean, default: true }
});

const TestQuestion = mongoose.model('TestQuestion', testQuestionSchema);

// Course Model
const courseSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    faculty: { type: String, required: true },
    semester: { type: String, enum: ['first', 'second'] },
    config: {
        examTimer: { type: Number, default: 50 },
        examQuestionCount: { type: Number, default: 40 },
        testTimer: { type: Number, default: 40 },
        testQuestionCount: { type: Number, default: 30 }
    }
});

const Course = mongoose.model('Course', courseSchema);

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, password, faculty, department, level } = req.body;
        
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const user = await User.create({
            fullName,
            username,
            password: hashedPassword,
            faculty,
            department,
            level
        });
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                faculty: user.faculty,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
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
                totalStudyTime: user.totalStudyTime,
                currentStreak: user.currentStreak,
                scores: user.scores
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get courses
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find().sort({ faculty: 1, code: 1 });
        
        const grouped = {};
        courses.forEach(course => {
            if (!grouped[course.faculty]) grouped[course.faculty] = { first: [], second: [] };
            grouped[course.faculty][course.semester].push(course);
        });
        
        res.json({ courses: grouped });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start exam session
app.post('/api/exams/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        
        const course = await Course.findOne({ code: courseCode });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        const questions = await ExamQuestion.aggregate([
            { $match: { courseCode, isActive: true } },
            { $sample: { size: course.config.examQuestionCount } }
        ]);
        
        res.json({
            sessionId: Date.now().toString(),
            course: courseCode,
            mode: 'exam',
            timeLimit: course.config.examTimer,
            questions: questions.map(q => ({
                id: q._id,
                text: q.text,
                options: q.options
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
        
        const course = await Course.findOne({ code: courseCode });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        const questions = await TestQuestion.aggregate([
            { $match: { courseCode, isActive: true } },
            { $sample: { size: course.config.testQuestionCount } }
        ]);
        
        res.json({
            sessionId: Date.now().toString(),
            course: courseCode,
            mode: 'test',
            timeLimit: course.config.testTimer,
            questions: questions.map(q => ({
                id: q._id,
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
        // Create admin user
        const bcrypt = require('bcryptjs');
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            await User.create({
                fullName: 'Administrator',
                username: 'admin',
                password: await bcrypt.hash('admin123', 12),
                faculty: 'Technology',
                department: 'Admin',
                level: '500',
                isAdmin: true
            });
        }
        
        // Create student user
        const studentExists = await User.findOne({ username: 'student' });
        if (!studentExists) {
            await User.create({
                fullName: 'Demo Student',
                username: 'student',
                password: await bcrypt.hash('pass123', 12),
                faculty: 'Technology',
                department: 'Computer Engineering',
                level: '300',
                examsTaken: 5,
                scores: [
                    { course: 'CHM 101', score: 35, totalQuestions: 40, percentage: 88, mode: 'exam' },
                    { course: 'MTH 101', score: 28, totalQuestions: 35, percentage: 80, mode: 'exam' }
                ]
            });
        }
        
        // Create courses
        const courses = [
            { code: 'CHM 101', name: 'General Chemistry I', faculty: 'Technology', semester: 'first', config: { examTimer: 50, examQuestionCount: 40, testTimer: 40, testQuestionCount: 30 } },
            { code: 'MTH 101', name: 'Elementary Mathematics I', faculty: 'Technology', semester: 'first', config: { examTimer: 50, examQuestionCount: 40, testTimer: 40, testQuestionCount: 30 } },
            { code: 'PHY 101', name: 'General Physics I', faculty: 'Technology', semester: 'first', config: { examTimer: 50, examQuestionCount: 40, testTimer: 40, testQuestionCount: 30 } },
            { code: 'COS 101', name: 'Introduction to Computing', faculty: 'Technology', semester: 'first', config: { examTimer: 50, examQuestionCount: 40, testTimer: 40, testQuestionCount: 30 } },
            { code: 'BIO 101', name: 'General Biology I', faculty: 'Science', semester: 'first', config: { examTimer: 50, examQuestionCount: 40, testTimer: 40, testQuestionCount: 30 } }
        ];
        
        for (const course of courses) {
            await Course.findOneAndUpdate({ code: course.code }, course, { upsert: true });
        }
        
        // Create sample exam questions
        const examQuestions = [
            { courseCode: 'CHM 101', text: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correctOption: 1, explanation: 'Carbon has 6 protons.', difficulty: 'easy' },
            { courseCode: 'CHM 101', text: 'Which is a noble gas?', options: ['Oxygen', 'Nitrogen', 'Helium', 'Hydrogen'], correctOption: 2, explanation: 'Helium is a noble gas.', difficulty: 'easy' },
            { courseCode: 'MTH 101', text: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctOption: 1, explanation: 'Basic addition.', difficulty: 'easy' },
            { courseCode: 'MTH 101', text: 'Solve for x: 2x = 10', options: ['2', '5', '10', '20'], correctOption: 1, explanation: 'Divide both sides by 2.', difficulty: 'easy' }
        ];
        
        for (const q of examQuestions) {
            const exists = await ExamQuestion.findOne({ courseCode: q.courseCode, text: q.text });
            if (!exists) {
                await ExamQuestion.create(q);
            }
        }
        
        // Create sample test questions
        const testQuestions = [
            { courseCode: 'CHM 101', text: 'What is H2O commonly known as?', options: ['Salt', 'Water', 'Sugar', 'Alcohol'], correctOption: 1, explanation: 'H2O is water.', hint: 'You drink it every day.', difficulty: 'easy' },
            { courseCode: 'MTH 101', text: 'What is 5 × 6?', options: ['25', '30', '35', '40'], correctOption: 1, explanation: '5 times 6 equals 30.', hint: 'Think of 5 groups of 6.', difficulty: 'easy' }
        ];
        
        for (const q of testQuestions) {
            const exists = await TestQuestion.findOne({ courseCode: q.courseCode, text: q.text });
            if (!exists) {
                await TestQuestion.create(q);
            }
        }
        
        res.json({ success: true, message: 'Database seeded successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.use(express.static('../frontend'));

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        
        // Auto-seed on first run
        const courseCount = await Course.countDocuments();
        if (courseCount === 0) {
            console.log('🌱 Seeding database...');
            const bcrypt = require('bcryptjs');
            
            await User.findOneAndUpdate(
                { username: 'admin' },
                { fullName: 'Administrator', username: 'admin', password: await bcrypt.hash('admin123', 12), faculty: 'Technology', department: 'Admin', level: '500', isAdmin: true },
                { upsert: true }
            );
            
            await User.findOneAndUpdate(
                { username: 'student' },
                { fullName: 'Demo Student', username: 'student', password: await bcrypt.hash('pass123', 12), faculty: 'Technology', department: 'Computer Eng.', level: '300' },
                { upsert: true }
            );
            
            const courses = [
                { code: 'CHM 101', name: 'General Chemistry I', faculty: 'Technology', semester: 'first' },
                { code: 'MTH 101', name: 'Elementary Mathematics I', faculty: 'Technology', semester: 'first' },
                { code: 'PHY 101', name: 'General Physics I', faculty: 'Technology', semester: 'first' },
                { code: 'COS 101', name: 'Introduction to Computing', faculty: 'Technology', semester: 'first' },
                { code: 'BIO 101', name: 'General Biology I', faculty: 'Science', semester: 'first' }
            ];
            
            for (const course of courses) {
                await Course.findOneAndUpdate({ code: course.code }, course, { upsert: true });
            }
            
            console.log('✅ Database seeded!');
        }
        
        app.listen(process.env.PORT, () => {
            console.log(`🚀 Server running on port ${process.env.PORT}`);
            console.log(`🔐 Login: admin/admin123 or student/pass123`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });
