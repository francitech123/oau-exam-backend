const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// ==================== IMPORT ROUTES ====================
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const testRoutes = require('./routes/tests');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const leaderboardRoutes = require('./routes/leaderboard');
const commentRoutes = require('./routes/comments');

const app = express();

// ==================== SECURITY ====================
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

// ==================== CORS ====================
const allowedOrigins = [
    'https://oau-exam-plug.vercel.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://localhost:5000'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('❌ Blocked by CORS:', origin);
            callback(null, true); // Allow all in production
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ==================== RATE LIMITING ====================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many authentication attempts.' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// ==================== BODY PARSING ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== LOGGING ====================
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// ==================== API ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/comments', commentRoutes);

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
    const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'production'
    };
    res.json(healthData);
});

// ==================== ROOT ====================
app.get('/', (req, res) => {
    res.json({
        name: 'OAU Exam Plug API',
        version: '2.0.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth/*',
            exams: '/api/exams/*',
            tests: '/api/tests/*',
            users: '/api/users/*',
            ai: '/api/ai/*',
            notifications: '/api/notifications/*',
            leaderboard: '/api/leaderboard/*',
            comments: '/api/comments/*',
            health: '/api/health'
        }
    });
});

// ==================== 404 HANDLERS ====================
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            '/api/auth/login',
            '/api/auth/register',
            '/api/exams/session/start',
            '/api/exams/session/submit',
            '/api/tests/session/start',
            '/api/tests/session/submit',
            '/api/users/stats',
            '/api/users/profile',
            '/api/ai/chat',
            '/api/notifications',
            '/api/leaderboard',
            '/api/comments',
            '/api/health'
        ]
    });
});

app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: 'Visit /api/health to check server status'
    });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: Object.values(err.errors).map(e => e.message)
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }
    
    if (err.code === 11000) {
        return res.status(400).json({
            error: 'Duplicate entry',
            field: Object.keys(err.keyValue)[0]
        });
    }
    
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// ==================== DATABASE ====================
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log('');
        console.log('╔══════════════════════════════════════════╗');
        console.log('║     OAU EXAM PLUG API - v2.0.0          ║');
        console.log('╠══════════════════════════════════════════╣');
        console.log(`║  🚀 Port:        ${PORT}                       ║`);
        console.log(`║  🌍 Environment: ${(process.env.NODE_ENV || 'production')}                  ║`);
        console.log('║  📡 Health:      /api/health              ║');
        console.log('║  🔐 Auth:        /api/auth/*              ║');
        console.log('║  📝 Exams:       /api/exams/*             ║');
        console.log('║  🧪 Tests:       /api/tests/*             ║');
        console.log('║  👤 Users:       /api/users/*             ║');
        console.log('║  🤖 AI:          /api/ai/*                ║');
        console.log('║  🔔 Notify:      /api/notifications/*     ║');
        console.log('║  🏆 Leaderboard: /api/leaderboard/*       ║');
        console.log('║  💬 Comments:    /api/comments/*          ║');
        console.log('╚══════════════════════════════════════════╝');
        console.log('');
    });
});

// ==================== SHUTDOWN ====================
const shutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} received. Shutting down...`);
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB closed');
    } catch (err) {
        console.error('❌ Error closing MongoDB:', err);
    }
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});

module.exports = app;
