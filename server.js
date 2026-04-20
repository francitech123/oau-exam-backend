const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// ==================== SECURITY MIDDLEWARE ====================
// Helmet - Sets secure HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
}));

// CORS - Restrict origins
const allowedOrigins = [
    'https://oau-exam-frontend.vercel.app',
    'https://all-oau-cbt-exampractice-by-francistech.edgeone.app',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️ Blocked CORS request from: ${origin}`);
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    maxAge: 86400
}));

// Rate Limiting - Prevent brute force and DDoS
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 auth attempts per 15 minutes
    message: { error: 'Too many authentication attempts. Account temporarily locked.' },
    skipSuccessfulRequests: true
});

const examLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: { error: 'Too many exam submissions. Please slow down.' }
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/exams/session/submit', examLimiter);
app.use('/api/tests/session/submit', examLimiter);

// Data Sanitization - Prevent NoSQL injection
app.use(mongoSanitize());

// XSS Protection - Sanitize user input
app.use(xss());

// HTTP Parameter Pollution Prevention
app.use(hpp({
    whitelist: ['faculty', 'department', 'level', 'courseCode', 'difficulty']
}));

// Body Parser with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ==================== REQUEST LOGGING & TRACKING ====================
const loginAttempts = new Map();
const suspiciousIPs = new Set();

app.use((req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    req.clientIP = ip;
    
    // Log suspicious patterns
    if (req.url.includes('../') || req.url.includes('$') || req.url.includes('{')) {
        console.warn(`🚨 Suspicious request pattern from ${ip}: ${req.url}`);
        suspiciousIPs.add(ip);
    }
    
    if (suspiciousIPs.has(ip)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
});

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });
        console.log('✅ MongoDB connected securely');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        setTimeout(connectDB, 5000);
    }
};

// ==================== 14 FACULTIES ====================
const FACULTIES = [
    'Agriculture', 'Arts', 'Law', 'Science', 'Social Sciences',
    'Education', 'Pharmacy', 'Technology', 'Administration',
    'Environmental Design and Management', 'Basic Medical Sciences',
    'Clinical Sciences', 'Dentistry', 'Computing'
];

// ==================== ENCRYPTION HELPERS ====================
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || crypto.randomBytes(16).toString('hex');

function encryptSensitiveData(text) {
    if (!text) return null;
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ENCRYPTION_IV, 'hex'));
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decryptSensitiveData(encrypted) {
    if (!encrypted) return null;
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ENCRYPTION_IV, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// ==================== MODELS ====================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, maxlength: 100 },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 30 },
    email: { type: String, sparse: true, lowercase: true, trim: true, maxlength: 100 },
    password: { type: String, required: true },
    faculty: { type: String, required: true, enum: FACULTIES },
    department: { type: String, required: true, maxlength: 100 },
    level: { type: String, required: true, default: '100' },
    securityQuestion: { type: String, required: true },
    securityAnswer: { type: String, required: true }, // Encrypted
    isAdmin: { type: Boolean, default: false },
    examsTaken: { type: Number, default: 0, min: 0 },
    testsTaken: { type: Number, default: 0, min: 0 },
    totalStudyTime: { type: Number, default: 0, min: 0 },
    currentStreak: { type: Number, default: 0, min: 0 },
    lastActive: { type: Date, default: Date.now },
    studyGoals: { type: Number, default: 10, min: 1, max: 100 },
    achievements: [{ name: String, description: String, dateEarned: { type: Date, default: Date.now } }],
    scores: [{ course: String, score: Number, totalQuestions: Number, percentage: Number, mode: String, date: { type: Date, default: Date.now } }],
    preferences: { darkMode: { type: Boolean, default: true } },
    loginHistory: [{ ip: String, userAgent: String, timestamp: Date }],
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

// Encrypt security answer before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('securityAnswer')) {
        this.securityAnswer = encryptSensitiveData(this.securityAnswer.toLowerCase());
    }
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 14); // Increased rounds for security
    }
    next();
});

// Method to verify security answer
userSchema.methods.verifySecurityAnswer = function(answer) {
    const decrypted = decryptSensitiveData(this.securityAnswer);
    return decrypted === answer.toLowerCase();
};

const User = mongoose.model('User', userSchema);

const examQuestionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
    courseName: { type: String, maxlength: 100 },
    faculty: { type: String, required: true, enum: FACULTIES },
    level: { type: String, required: true },
    semester: { type: String, enum: ['first', 'second'] },
    mode: { type: String, default: 'exam' },
    text: { type: String, required: true, maxlength: 2000 },
    options: [{ type: String, required: true, maxlength: 500 }],
    correctOption: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, maxlength: 2000 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

const testQuestionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
    courseName: { type: String, maxlength: 100 },
    faculty: { type: String, required: true, enum: FACULTIES },
    level: { type: String, required: true },
    semester: { type: String, enum: ['first', 'second'] },
    mode: { type: String, default: 'test' },
    text: { type: String, required: true, maxlength: 2000 },
    options: [{ type: String, required: true, maxlength: 500 }],
    correctOption: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, maxlength: 2000 },
    hint: { type: String, maxlength: 500 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const TestQuestion = mongoose.model('TestQuestion', testQuestionSchema);

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 500 },
    type: { type: String, enum: ['success', 'info', 'warning', 'achievement'], default: 'info' },
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
    'AGR 101': 'Intro to Agriculture', 'AGR 102': 'Principles of Agriculture',
    'ENG 101': 'Intro to Literature', 'ENG 102': 'Advanced Literature',
    'JIL 101': 'Legal Methods', 'JIL 102': 'Nigerian Legal System',
    'BIO 101': 'General Biology I', 'BIO 102': 'General Biology II',
    'CHM 101': 'General Chemistry I', 'CHM 102': 'General Chemistry II',
    'MTH 101': 'Elementary Math I', 'MTH 102': 'Elementary Math II',
    'PHY 101': 'General Physics I', 'PHY 102': 'General Physics II',
    'PHY 103': 'Physics for Eng I', 'PHY 104': 'Physics for Eng II',
    'ECO 101': 'Principles of Economics I', 'ECO 102': 'Principles of Economics II',
    'CSC 101': 'Intro to Computing', 'CSC 102': 'Programming Fundamentals'
};

// ==================== AUTH MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password -securityAnswer');
        
        if (!user) return res.status(401).json({ error: 'User not found' });
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            return res.status(403).json({ error: 'Account temporarily locked' });
        }
        
        req.user = user;
        
        // Update last active and login history
        user.lastActive = new Date();
        user.loginHistory.push({ ip: req.clientIP, userAgent: req.headers['user-agent'], timestamp: new Date() });
        if (user.loginHistory.length > 10) user.loginHistory.shift();
        await user.save();
        
        next();
    } catch (e) {
        if (e.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
        if (e.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
        res.status(500).json({ error: 'Authentication error' });
    }
};

const adminMiddleware = async (req, res, next) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    next();
};

// ==================== VALIDATION HELPERS ====================
function validatePassword(password) {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain number';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Password must contain special character';
    return null;
}

function validateEmail(email) {
    if (!email) return null;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) ? null : 'Invalid email format';
}

function validateUsername(username) {
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 30) return 'Username must be less than 30 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return null;
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>'"]/g, '').trim();
}

// ==================== ROUTES ====================

app.get('/', (req, res) => res.json({ message: 'OAU Exam Plug API', status: 'secure', version: '4.0.0' }));
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, email, password, faculty, department, level, securityQuestion, securityAnswer } = req.body;
        
        // Validate inputs
        const usernameError = validateUsername(username);
        if (usernameError) return res.status(400).json({ error: usernameError });
        
        const emailError = validateEmail(email);
        if (email && emailError) return res.status(400).json({ error: emailError });
        
        const passwordError = validatePassword(password);
        if (passwordError) return res.status(400).json({ error: passwordError });
        
        if (!FACULTIES.includes(faculty)) return res.status(400).json({ error: 'Invalid faculty' });
        if (!securityQuestion || !securityAnswer) return res.status(400).json({ error: 'Security question and answer required' });
        
        const sanitizedFullName = sanitizeInput(fullName);
        const sanitizedDepartment = sanitizeInput(department);
        
        const exists = await User.findOne({ username: username.toLowerCase() });
        if (exists) return res.status(400).json({ error: 'Username already taken' });
        
        const hashed = await bcrypt.hash(password, 14);
        const encryptedAnswer = encryptSensitiveData(securityAnswer.toLowerCase());
        
        const user = await User.create({
            fullName: sanitizedFullName, username: username.toLowerCase(), email: email?.toLowerCase(),
            password: hashed, faculty, department: sanitizedDepartment, level: level || '100',
            securityQuestion, securityAnswer: encryptedAnswer, currentStreak: 1, lastActive: new Date(),
            loginHistory: [{ ip: req.clientIP, userAgent: req.headers['user-agent'], timestamp: new Date() }]
        });
        
        await Notification.create({ user: user._id, title: '🎉 Welcome!', message: `Welcome ${sanitizedFullName}! Start practicing today.`, type: 'success' });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.securityAnswer;
        
        res.status(201).json({ token, user: userResponse });
    } catch (e) { res.status(500).json({ error: 'Registration failed' }); }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const ip = req.clientIP;
        const key = `${ip}:${username}`;
        const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: Date.now() };
        
        if (attempts.count >= 5) {
            const timeSinceLast = Date.now() - attempts.lastAttempt;
            if (timeSinceLast < 15 * 60 * 1000) {
                return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
            }
            loginAttempts.delete(key);
        }
        
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            attempts.count++; attempts.lastAttempt = Date.now();
            loginAttempts.set(key, attempts);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            return res.status(403).json({ error: 'Account temporarily locked' });
        }
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= 5) {
                user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            }
            await user.save();
            
            attempts.count++; attempts.lastAttempt = Date.now();
            loginAttempts.set(key, attempts);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        loginAttempts.delete(key);
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        
        const today = new Date().toDateString();
        const last = user.lastActive?.toDateString();
        if (last !== today) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            user.currentStreak = (last === yesterday.toDateString()) ? user.currentStreak + 1 : 1;
            user.lastActive = new Date();
            
            if (user.currentStreak === 7) {
                user.achievements.push({ name: 'Week Warrior', description: '7-day study streak!' });
                await Notification.create({ user: user._id, title: '🏆 Achievement!', message: 'Week Warrior: 7-day streak!', type: 'achievement' });
            }
        }
        
        user.loginHistory.push({ ip: req.clientIP, userAgent: req.headers['user-agent'], timestamp: new Date() });
        if (user.loginHistory.length > 10) user.loginHistory.shift();
        await user.save();
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.securityAnswer;
        
        res.json({ token, user: userResponse });
    } catch (e) { res.status(500).json({ error: 'Login failed' }); }
});

// Get courses
app.get('/api/courses', (req, res) => {
    res.json({ courses: COURSES_100, courseNames: COURSE_NAMES, faculties: FACULTIES });
});

// Leaderboard (Public data only - no sensitive info)
app.get('/api/users/leaderboard', async (req, res) => {
    try {
        const users = await User.find({}).select('username faculty examsTaken testsTaken scores achievements createdAt').lean();
        const leaderboard = users.map(u => {
            const scores = u.scores || [];
            const avg = scores.length ? Math.round(scores.reduce((a, b) => a + (b.percentage || 0), 0) / scores.length) : 0;
            return {
                name: u.username, faculty: u.faculty, examsTaken: u.examsTaken || 0, testsTaken: u.testsTaken || 0,
                overallAvg: avg, achievements: (u.achievements || []).length, registeredDate: u.createdAt
            };
        }).filter(u => u.examsTaken > 0 || u.testsTaken > 0).sort((a, b) => b.overallAvg - a.overallAvg);
        res.json({ leaderboard });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get notifications (Authenticated)
app.get('/api/users/notifications', authMiddleware, async (req, res) => {
    try {
        const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
        res.json({ notifications: notifs });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mark notifications read
app.put('/api/users/notifications/read', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update profile
app.put('/api/users/profile', authMiddleware, async (req, res) => {
    try {
        const { fullName, email, faculty, department, level, studyGoals } = req.body;
        const user = await User.findById(req.user._id);
        
        if (fullName) user.fullName = sanitizeInput(fullName);
        if (email) {
            const emailError = validateEmail(email);
            if (emailError) return res.status(400).json({ error: emailError });
            user.email = email.toLowerCase();
        }
        if (faculty && FACULTIES.includes(faculty)) user.faculty = faculty;
        if (department) user.department = sanitizeInput(department);
        if (level) user.level = level;
        if (studyGoals) user.studyGoals = Math.min(100, Math.max(1, studyGoals));
        
        await user.save();
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.securityAnswer;
        
        res.json({ success: true, user: userResponse });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Change password
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const passwordError = validatePassword(newPassword);
        if (passwordError) return res.status(400).json({ error: passwordError });
        
        const user = await User.findById(req.user._id);
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
        
        user.password = await bcrypt.hash(newPassword, 14);
        await user.save();
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Start exam session
app.post('/api/exams/session/start', authMiddleware, async (req, res) => {
    try {
        const { courseCode } = req.body;
        let questions = await ExamQuestion.find({ courseCode: courseCode.toUpperCase(), mode: 'exam' }).limit(40);
        if (!questions.length) {
            questions = [{ text: 'Sample Question', options: ['A', 'B', 'C', 'D'], correctOption: 0, explanation: 'Sample' }];
        }
        res.json({ sessionId: crypto.randomUUID(), course: courseCode.toUpperCase(), mode: 'exam', timeLimit: 50, questions });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Start test session
app.post('/api/tests/session/start', authMiddleware, async (req, res) => {
    try {
        const { courseCode } = req.body;
        let questions = await TestQuestion.find({ courseCode: courseCode.toUpperCase(), mode: 'test' }).limit(30);
        if (!questions.length) {
            questions = [{ text: 'Sample Test', options: ['A', 'B', 'C', 'D'], correctOption: 0, hint: 'Think', explanation: 'Sample' }];
        }
        res.json({ sessionId: crypto.randomUUID(), course: courseCode.toUpperCase(), mode: 'test', timeLimit: 40, questions });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Submit exam
app.post('/api/exams/session/submit', authMiddleware, async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        const user = await User.findById(req.user._id);
        
        const qIds = Object.keys(answers);
        const questions = await ExamQuestion.find({ _id: { $in: qIds } });
        let correct = 0;
        questions.forEach(q => { if (answers[q._id] === q.correctOption) correct++; });
        const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
        
        user.examsTaken = (user.examsTaken || 0) + 1;
        user.totalStudyTime = (user.totalStudyTime || 0) + Math.floor((timeSpent || 0) / 1000);
        user.scores.push({ course: courseCode.toUpperCase(), score: correct, totalQuestions: questions.length, percentage: pct, mode: 'exam' });
        
        if (user.examsTaken === 1) {
            user.achievements.push({ name: 'First Exam', description: 'Completed first exam!' });
            await Notification.create({ user: user._id, title: '🏆 First Exam!', message: 'You completed your first exam!', type: 'achievement' });
        }
        if (pct >= 90) {
            user.achievements.push({ name: 'Excellence', description: 'Scored 90%+' });
            await Notification.create({ user: user._id, title: '🏆 Excellence!', message: `Amazing! ${pct}% in ${courseCode}!`, type: 'achievement' });
        }
        
        await user.save();
        await Notification.create({ user: user._id, title: '📝 Exam Completed!', message: `You scored ${pct}% in ${courseCode}. ${correct}/${questions.length} correct.`, type: 'success' });
        
        res.json({ score: pct, correctCount: correct, totalQuestions: questions.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Submit test
app.post('/api/tests/session/submit', authMiddleware, async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        const user = await User.findById(req.user._id);
        
        const qIds = Object.keys(answers);
        const questions = await TestQuestion.find({ _id: { $in: qIds } });
        let correct = 0;
        questions.forEach(q => { if (answers[q._id] === q.correctOption) correct++; });
        const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
        
        user.testsTaken = (user.testsTaken || 0) + 1;
        user.totalStudyTime = (user.totalStudyTime || 0) + Math.floor((timeSpent || 0) / 1000);
        user.scores.push({ course: courseCode.toUpperCase(), score: correct, totalQuestions: questions.length, percentage: pct, mode: 'test' });
        
        await user.save();
        await Notification.create({ user: user._id, title: '🧪 Test Completed!', message: `You scored ${pct}% in ${courseCode} test. ${correct}/${questions.length} correct.`, type: 'success' });
        
        res.json({ score: pct, correctCount: correct, totalQuestions: questions.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// AI Chat (Simple secure version)
app.post('/api/ai/chat', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('faculty') || lowerMsg.includes('faculties')) {
            return res.json({ reply: `OAU has 14 faculties: ${FACULTIES.join(', ')}. 100 level courses are available now!` });
        }
        if (lowerMsg.includes('course') || lowerMsg.includes('courses')) {
            return res.json({ reply: '100 level courses include GST 111, GST 112, CHM 101, MTH 101, PHY 101, BIO 101, CSC 101, and more! 200-500 level coming soon.' });
        }
        if (lowerMsg.includes('study') || lowerMsg.includes('tip')) {
            return res.json({ reply: '📚 Study Tips: Use active recall, spaced repetition, take 15-min breaks every hour, and get 7-8 hours of sleep before exams!' });
        }
        res.json({ reply: "I'm ExamPlugAI by Francistech! Ask me about faculties, courses, or study tips." });
    } catch (e) { res.json({ reply: "I'm here to help!" }); }
});

// ==================== ADMIN ROUTES (Secure) ====================
app.post('/api/admin/questions/exam', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const question = await ExamQuestion.create({ ...req.body, createdBy: req.user._id });
        await Notification.create({
            user: req.user._id,
            title: '📚 New Exam Question',
            message: `New exam question added for ${question.courseCode}`,
            type: 'success'
        });
        res.json({ success: true, question });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/questions/test', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const question = await TestQuestion.create({ ...req.body, createdBy: req.user._id });
        res.json({ success: true, question });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({ error: 'Internal server error' });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🔒 Secure server running on port ${PORT}`);
        console.log(`🛡️ Security: Helmet | Rate Limit | CORS | XSS | Sanitize | HPP`);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server...');
    mongoose.connection.close();
    process.exit(0);
});
