const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const today = new Date().toDateString();
        const lastActive = req.user.lastActive?.toDateString();
        
        if (lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastActive === yesterday.toDateString()) {
                req.user.currentStreak += 1;
                if (req.user.currentStreak > req.user.longestStreak) {
                    req.user.longestStreak = req.user.currentStreak;
                }
            } else {
                req.user.currentStreak = 1;
            }
            req.user.lastActive = new Date();
            await req.user.save();
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Not authorized' });
    }
};
