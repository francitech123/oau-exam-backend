const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, sparse: true, lowercase: true },
    password: { type: String, required: true },
    faculty: { type: String, required: true },
    department: { type: String, required: true },
    level: { type: String, required: true, default: '100' },
    securityQuestion: { type: String, required: true },
    securityAnswer: { type: String, required: true },
    profilePicture: { type: String, default: null },
    isAdmin: { type: Boolean, default: false },
    examsTaken: { type: Number, default: 0 },
    testsTaken: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    scores: [{
        course: String,
        score: Number,
        totalQuestions: Number,
        mode: { type: String, enum: ['exam', 'test'] },
        date: { type: Date, default: Date.now }
    }],
    achievements: [{
        name: String,
        description: String,
        icon: String,
        dateEarned: { type: Date, default: Date.now }
    }],
    preferences: {
        darkMode: { type: Boolean, default: false },
        emailNotifications: { type: Boolean, default: true }
    },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getAverageScore = function() {
    if (!this.scores.length) return 0;
    const sum = this.scores.reduce((acc, s) => acc + (s.score / s.totalQuestions * 100), 0);
    return Math.round(sum / this.scores.length);
};

module.exports = mongoose.model('User', userSchema);
