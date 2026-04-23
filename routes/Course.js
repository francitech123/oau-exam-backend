const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    faculty: { type: String, required: true },
    semester: { type: String, enum: ['first', 'second'] },
    level: { type: String, default: '100' },
    config: {
        examTimer: { type: Number, default: 50 },
        examQuestionCount: { type: Number, default: 40 },
        testTimer: { type: Number, default: 40 },
        testQuestionCount: { type: Number, default: 30 }
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
