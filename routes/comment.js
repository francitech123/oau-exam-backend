const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const router = express.Router();

// ==================== COMMENT SCHEMA ====================
const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: [true, 'Comment text is required'],
        maxlength: [500, 'Comment cannot exceed 500 characters'],
        trim: true
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add index for faster queries
commentSchema.index({ createdAt: -1 });
commentSchema.index({ user: 1 });

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

// ==================== ROUTES ====================

// GET /api/comments - Get all comments (public)
router.get('/', async (req, res) => {
    try {
        const comments = await Comment.find({ isApproved: true })
            .populate('user', 'fullName faculty department level')
            .sort({ createdAt: -1 })
            .limit(100);

        const formattedComments = comments.map(comment => {
            const user = comment.user || {};
            const firstName = user.fullName ? user.fullName.split(' ')[0] : 'Anonymous';
            const initials = user.fullName 
                ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : 'AN';

            return {
                id: comment._id,
                text: comment.text,
                userName: user.fullName || 'Anonymous',
                userInitial: initials,
                faculty: user.faculty || '',
                department: user.department || '',
                level: user.level || '',
                createdAt: comment.createdAt
            };
        });

        res.json({
            success: true,
            comments: formattedComments,
            total: formattedComments.length
        });

    } catch (error) {
        console.error('❌ Get comments error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch comments' 
        });
    }
});

// POST /api/comments - Create a comment (requires authentication)
router.post('/', protect, async (req, res) => {
    try {
        const { text } = req.body;

        // Validate comment text
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Comment cannot be empty' 
            });
        }

        if (text.length > 500) {
            return res.status(400).json({ 
                success: false,
                error: 'Comment is too long. Maximum 500 characters allowed.' 
            });
        }

        // Check for profanity or spam (basic check)
        const spamWords = ['http://', 'https://', 'www.'];
        const containsSpam = spamWords.some(word => text.toLowerCase().includes(word));
        
        // Create comment
        const comment = await Comment.create({
            user: req.user._id,
            text: text.trim(),
            isApproved: !containsSpam // Auto-flag links for review
        });

        // Populate user data
        const populatedComment = await Comment.findById(comment._id)
            .populate('user', 'fullName faculty department level');

        const user = populatedComment.user || {};
        const initials = user.fullName 
            ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'AN';

        res.status(201).json({
            success: true,
            message: containsSpam ? 'Comment submitted for review' : 'Comment posted successfully',
            comment: {
                id: populatedComment._id,
                text: populatedComment.text,
                userName: user.fullName || 'Anonymous',
                userInitial: initials,
                faculty: user.faculty || '',
                department: user.department || '',
                level: user.level || '',
                createdAt: populatedComment.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Post comment error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to post comment. Please try again.' 
        });
    }
});

// DELETE /api/comments/:id - Delete a comment (owner or admin only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ 
                success: false,
                error: 'Comment not found' 
            });
        }

        // Check if user is the owner or an admin
        if (comment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ 
                success: false,
                error: 'Not authorized to delete this comment' 
            });
        }

        await Comment.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete comment error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete comment' 
        });
    }
});

// PUT /api/comments/:id - Update a comment (owner only)
router.put('/:id', protect, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Comment cannot be empty' 
            });
        }

        if (text.length > 500) {
            return res.status(400).json({ 
                success: false,
                error: 'Comment is too long. Maximum 500 characters allowed.' 
            });
        }

        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ 
                success: false,
                error: 'Comment not found' 
            });
        }

        // Only the owner can edit
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                error: 'Not authorized to edit this comment' 
            });
        }

        comment.text = text.trim();
        await comment.save();

        res.json({
            success: true,
            message: 'Comment updated successfully',
            comment: {
                id: comment._id,
                text: comment.text
            }
        });

    } catch (error) {
        console.error('❌ Update comment error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update comment' 
        });
    }
});

// GET /api/comments/count - Get total comment count
router.get('/count', async (req, res) => {
    try {
        const count = await Comment.countDocuments({ isApproved: true });
        
        res.json({
            success: true,
            count: count
        });

    } catch (error) {
        console.error('❌ Comment count error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to get comment count' 
        });
    }
});

module.exports = router;
