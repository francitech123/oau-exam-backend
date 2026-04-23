const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true, index: true },
    mode: { type: String, required: true, enum: ['exam', 'test'] },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true, min: 0, max: 3 },
    hint: { type: String, default: '' },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
