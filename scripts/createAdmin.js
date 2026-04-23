require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema inline (so we don't have import issues)
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

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        // Connect to MongoDB
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!\n');

        const adminData = {
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
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('📧 Username:', existingAdmin.username);
            console.log('👤 Name:', existingAdmin.fullName);
            
            // Promote to admin if not already
            if (!existingAdmin.isAdmin) {
                existingAdmin.isAdmin = true;
                // Update password too
                existingAdmin.password = adminData.password;
                await existingAdmin.save();
                console.log('✅ Existing user promoted to ADMIN!');
                console.log('🔑 Password has been reset to: Admin123!');
            } else {
                console.log('✅ User is already an admin.');
                // Reset password anyway so you know it
                existingAdmin.password = adminData.password;
                await existingAdmin.save();
                console.log('🔑 Password has been reset to: Admin123!');
            }
        } else {
            // Create new admin user
            const admin = await User.create(adminData);
            console.log('🎉 New Admin User Created Successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Username:', admin.username);
            console.log('🔑 Password:', 'Admin123!');
            console.log('👤 Name:', admin.fullName);
            console.log('🎓 Faculty:', admin.faculty);
            console.log('🏛️  Department:', admin.department);
            console.log('⭐ Level:', admin.level);
            console.log('👑 Admin:', admin.isAdmin ? 'YES ✅' : 'NO ❌');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }

        // Verify the admin was created
        const verifyAdmin = await User.findOne({ username: 'admin' });
        console.log('\n🔍 Verification:');
        console.log('   Username:', verifyAdmin.username);
        console.log('   isAdmin:', verifyAdmin.isAdmin);
        console.log('   ID:', verifyAdmin._id);

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed.');
        console.log('🚀 Ready to login at: https://oau-exam-plug.vercel.app/login');
        console.log('   Username: admin');
        console.log('   Password: Admin123!');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error creating admin:', error.message);
        if (error.code === 11000) {
            console.log('⚠️  Duplicate key error - admin may already exist.');
        }
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the script
console.log('╔══════════════════════════════════╗');
console.log('║   OAU Exam Plug - Admin Creator  ║');
console.log('╚══════════════════════════════════╝\n');

createAdmin();
