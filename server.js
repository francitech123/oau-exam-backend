const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import all routes
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const testRoutes = require('./routes/tests');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const leaderboardRoutes = require('./routes/leaderboard');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

const app = express();

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            frameSrc: ["'self'", "https://chat.openai.com", "https://claude.ai", "https://www.perplexity.ai", "https://chat.deepseek.com"],
            connectSrc: ["'self'", "https://api.paystack.co", "https://api.flutterwave.com"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: [
        'https://oau-exam-plug.vercel.app',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        version: '2.0.0',
        endpoints: [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/me',
            '/api/auth/forgot-password',
            '/api/auth/reset-password',
            '/api/auth/change-password',
            '/api/exams/session/start',
            '/api/exams/session/submit',
            '/api/tests/session/start',
            '/api/tests/session/submit',
            '/api/users/stats',
            '/api/users/profile',
            '/api/ai/chat',
            '/api/notifications',
            '/api/notifications/read',
            '/api/leaderboard',
            '/api/leaderboard/top',
            '/api/comments',
            '/api/admin/questions',
            '/api/admin/courses',
            '/api/admin/seed-courses',
            '/api/admin/stats'
        ]
    });
});

// ==================== ROOT ROUTE ====================
app.get('/', (req, res) => {
    res.json({
        name: 'OAU Exam Plug API',
        version: '2.0.0',
        description: 'Backend API for OAU Exam Plug - Premium CBT Practice Platform',
        docs: 'https://oau-exam-plug.vercel.app',
        health: '/api/health'
    });
});

// ==================== 404 HANDLER ====================
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl 
    });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🚀 OAU Exam Plug API v2.0`);
        console.log(`📡 Port: ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
        console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
        console.log(`📊 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing gracefully...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received. Closing gracefully...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    // Don't crash the server, just log it
});

module.exports = app;
