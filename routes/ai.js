const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// AI Chat endpoint
router.post('/chat', protect, async (req, res) => {
    try {
        const { message } = req.body;
        
        // Pre-defined responses for common questions
        const responses = {
            'gst 111': 'GST 111 (Use of English I) covers grammar, comprehension, essay writing, and communication skills. Key topics include parts of speech, sentence structure, paragraph development, and summary writing.',
            'chm 101': 'CHM 101 (General Chemistry I) covers atomic structure, chemical bonding, stoichiometry, states of matter, and periodic table trends. Focus on understanding mole concepts and balancing equations.',
            'mth 101': 'MTH 101 (Elementary Mathematics I) covers set theory, functions, limits, differentiation, and integration basics. Practice solving problems regularly!',
            'phy 101': 'PHY 101 (General Physics I) covers mechanics, kinematics, dynamics, work and energy, and rotational motion. Understand the fundamental principles and practice problem-solving.',
            'bio 101': 'BIO 101 (General Biology I) covers cell structure, genetics, evolution, and diversity of life. Focus on understanding processes rather than memorization.',
            'study tips': 'Here are proven study tips: 1) Use active recall (test yourself), 2) Space out your studying (spaced repetition), 3) Get 7-8 hours of sleep, 4) Study in 25-minute focused sessions (Pomodoro), 5) Teach others to reinforce learning.',
            'achievements': 'You can earn achievements by: completing exams (First Exam badge), maintaining streaks (Week Warrior), scoring high (High Achiever - 80%+), and getting perfect scores (Perfect Score badge)!',
            'faculties': 'OAU has 14 faculties: Agriculture, Arts, Law, Science, Social Sciences, Education, Pharmacy, Technology, Administration, Environmental Design, Basic Medical Sciences, Clinical Sciences, Dentistry, and Computing.',
            'streak': 'Your streak increases when you study or take exams on consecutive days. Keep it going to earn achievements and climb the leaderboard!'
        };
        
        // Find matching response
        let reply = '';
        const lowerMessage = message.toLowerCase();
        
        for (const [key, value] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                reply = value;
                break;
            }
        }
        
        if (!reply) {
            reply = `Thanks for your question about "${message}". I'm ExamPlugAI, your study assistant! I can help with OAU courses, study tips, exam strategies, and platform features. What specific topic would you like to learn about?`;
        }
        
        res.json({ reply });
        
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: 'AI service unavailable' });
    }
});

module.exports = router;
