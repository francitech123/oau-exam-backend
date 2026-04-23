require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            // Update existing user to admin
            existingAdmin.isAdmin = true;
            await existingAdmin.save();
            console.log('✅ Existing user promoted to admin:', existingAdmin.username);
        } else {
            // Create new admin
            const admin = await User.create({
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
            console.log('✅ Admin created:', admin.username);
            console.log('📧 Username: admin');
            console.log('🔑 Password: Admin123!');
        }

        await mongoose.connection.close();
        console.log('✅ Done!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdmin();
