const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { user: req.user._id },
                { isGlobal: true }
            ]
        }).sort({ createdAt: -1 }).limit(50);
        
        res.json({ notifications });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark as read
router.put('/read', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// Create global notification (admin only)
router.post('/global', protect, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin only' });
        }
        
        const { title, message, type, link } = req.body;
        
        const notification = await Notification.create({
            isGlobal: true,
            title,
            message,
            type: type || 'update',
            link
        });
        
        res.status(201).json({ notification });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

module.exports = router;
// Add this BEFORE module.exports = router;

// Test notification (for development)
router.post('/test', protect, async (req, res) => {
    try {
        const { title, message, type } = req.body;
        
        const notification = await Notification.create({
            user: req.user._id,
            title: title || 'Test Notification',
            message: message || 'This is a test notification.',
            type: type || 'info'
        });
        
        res.status(201).json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

// Create global notification (admin only)
router.post('/global', protect, async (req, res) => {
    try {
        // Check if user is admin (you can set this in MongoDB)
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { title, message, type, link } = req.body;
        
        const notification = await Notification.create({
            isGlobal: true,
            title,
            message,
            type: type || 'update',
            link
        });
        
        res.status(201).json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create notification' });
    }
});
