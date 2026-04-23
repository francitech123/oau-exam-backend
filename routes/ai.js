const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// AI Chat endpoint (placeholder - ready for Gemini/OpenAI integration)
router.post('/chat', protect, async (req, res) => {
    try {
        const { message } = req.body;
        
        // This is where you'll integrate Gemini API
        // For now, return a placeholder response
        const reply = `I'm ExamPlugAI, your study assistant! You asked: "${message}". I'm ready to help with OAU courses, study tips, and exam strategies. (AI integration coming soon!)`;
        
        res.json({ reply });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: 'AI service unavailable' });
    }
});

module.exports = router;
