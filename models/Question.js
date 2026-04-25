const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true, index: true },
    courseName: String,
    mode: { type: String, required: true, enum: ['exam', 'test', 'practice'], index: true },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true, min: 0, max: 3 },
    hint: { type: String, default: '' },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isApproved: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

questionSchema.index({ courseCode: 1, mode: 1 });

module.exports = mongoose.model('Question', questionSchema);
