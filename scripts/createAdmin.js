require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: String,
    username: { type: String, unique: true, lowercase: true },
    email: String,
    password: String,
    faculty: String,
    department: String,
    level: String,
    securityQuestion: String,
    securityAnswer: String,
    isAdmin: { type: Boolean, default: false },
    examsTaken: { type: Number, default: 0 },
    testsTaken: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    scores: [],
    achievements: [],
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const existing = await User.findOne({ username: 'admin' });
        
        if (existing) {
            existing.isAdmin = true;
            existing.password = 'Admin123!';
            await existing.save();
            console.log('✅ Existing user promoted to admin!');
        } else {
            await User.create({
                fullName: 'Admin User',
                username: 'admin',
                email: 'admin@oauexamplug.com',
                password: 'Admin123!',
                faculty: 'Technology',
                department: 'Administration',
                level: '500',
                securityQuestion: 'pet',
                securityAnswer: 'admin',
                isAdmin: true
            });
            console.log('✅ Admin created!');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Username: admin');
        console.log('🔑 Password: Admin123!');
        console.log('🌐 Login at: https://oau-exam-plug.vercel.app/login');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdmin();
