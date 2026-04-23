require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Course = require('../models/Course');

const sampleQuestions = {
    'CHM 101': {
        exam: [
            {
                text: 'What is the atomic number of Carbon?',
                options: ['4', '6', '8', '12'],
                correctOption: 1,
                explanation: 'Carbon has 6 protons, so its atomic number is 6.',
                difficulty: 'easy'
            },
            {
                text: 'Which of the following is a noble gas?',
                options: ['Oxygen', 'Nitrogen', 'Helium', 'Hydrogen'],
                correctOption: 2,
                explanation: 'Helium is a noble gas with a full valence shell.',
                difficulty: 'easy'
            },
            {
                text: 'Calculate the molar mass of water (H₂O). (H=1, O=16)',
                options: ['16 g/mol', '17 g/mol', '18 g/mol', '20 g/mol'],
                correctOption: 2,
                explanation: 'H₂O = (2 × 1) + 16 = 18 g/mol',
                difficulty: 'medium'
            },
            {
                text: 'What is the pH of a neutral solution at 25°C?',
                options: ['0', '5', '7', '14'],
                correctOption: 2,
                explanation: 'A neutral solution has a pH of 7 at 25°C.',
                difficulty: 'easy'
            },
            {
                text: 'Which subatomic particle has a negative charge?',
                options: ['Proton', 'Neutron', 'Electron', 'Positron'],
                correctOption: 2,
                explanation: 'Electrons carry a negative charge.',
                difficulty: 'easy'
            }
        ],
        test: [
            {
                text: 'What is the most abundant element in the universe?',
                options: ['Oxygen', 'Carbon', 'Hydrogen', 'Helium'],
                correctOption: 2,
                hint: 'It\'s the lightest element.',
                explanation: 'Hydrogen makes up about 75% of the universe\'s elemental mass.',
                difficulty: 'easy'
            },
            {
                text: 'What is the chemical symbol for Gold?',
                options: ['Go', 'Gd', 'Au', 'Ag'],
                correctOption: 2,
                hint: 'It comes from the Latin word "aurum".',
                explanation: 'Au is derived from the Latin word aurum meaning gold.',
                difficulty: 'easy'
            },
            {
                text: 'Which acid is found in vinegar?',
                options: ['Citric acid', 'Acetic acid', 'Lactic acid', 'Sulfuric acid'],
                correctOption: 1,
                hint: 'It gives vinegar its characteristic smell.',
                explanation: 'Acetic acid (ethanoic acid) is the main component of vinegar.',
                difficulty: 'easy'
            }
        ]
    },
    'MTH 101': {
        exam: [
            {
                text: 'What is the derivative of x²?',
                options: ['x', '2x', '2', 'x²'],
                correctOption: 1,
                explanation: 'The power rule: d/dx(xⁿ) = n·xⁿ⁻¹, so d/dx(x²) = 2x',
                difficulty: 'easy'
            },
            {
                text: 'What is the value of sin(90°)?',
                options: ['0', '1', '-1', 'Undefined'],
                correctOption: 1,
                explanation: 'sin(90°) = 1',
                difficulty: 'easy'
            },
            {
                text: 'If A = {1, 2, 3} and B = {2, 3, 4}, what is A ∩ B?',
                options: ['{1, 4}', '{2, 3}', '{1, 2, 3, 4}', '∅'],
                correctOption: 1,
                explanation: 'Intersection contains elements common to both sets: {2, 3}',
                difficulty: 'medium'
            }
        ],
        test: [
            {
                text: 'What is the limit of 1/x as x approaches infinity?',
                options: ['0', '1', 'Infinity', 'Undefined'],
                correctOption: 0,
                hint: 'As x gets larger, the fraction gets smaller.',
                explanation: 'As x → ∞, 1/x → 0',
                difficulty: 'medium'
            }
        ]
    },
    'PHY 101': {
        exam: [
            {
                text: 'What is the SI unit of force?',
                options: ['Joule', 'Newton', 'Watt', 'Pascal'],
                correctOption: 1,
                explanation: 'Force is measured in Newtons (N).',
                difficulty: 'easy'
            },
            {
                text: 'What is the acceleration due to gravity on Earth (approximately)?',
                options: ['5.8 m/s²', '9.8 m/s²', '12.8 m/s²', '15.8 m/s²'],
                correctOption: 1,
                explanation: 'g ≈ 9.8 m/s² on Earth\'s surface.',
                difficulty: 'easy'
            },
            {
                text: 'Which law states that for every action there is an equal and opposite reaction?',
                options: ['Newton\'s First Law', 'Newton\'s Second Law', 'Newton\'s Third Law', 'Law of Gravity'],
                correctOption: 2,
                explanation: 'Newton\'s Third Law: For every action, there is an equal and opposite reaction.',
                difficulty: 'easy'
            }
        ],
        test: [
            {
                text: 'What type of energy does a moving object possess?',
                options: ['Potential energy', 'Kinetic energy', 'Thermal energy', 'Chemical energy'],
                correctOption: 1,
                hint: 'It\'s the energy of motion.',
                explanation: 'Kinetic energy is the energy of motion.',
                difficulty: 'easy'
            }
        ]
    },
    'GST 111': {
        exam: [
            {
                text: 'Which of these is NOT a part of speech?',
                options: ['Noun', 'Verb', 'Paragraph', 'Adjective'],
                correctOption: 2,
                explanation: 'Paragraph is a unit of writing, not a part of speech.',
                difficulty: 'easy'
            },
            {
                text: 'What is a synonym for "happy"?',
                options: ['Sad', 'Joyful', 'Angry', 'Tired'],
                correctOption: 1,
                explanation: 'Joyful means feeling or expressing happiness.',
                difficulty: 'easy'
            },
            {
                text: 'Which sentence is grammatically correct?',
                options: ['She go to school.', 'She goes to school.', 'She going to school.', 'She gone to school.'],
                correctOption: 1,
                explanation: 'Third person singular requires "goes".',
                difficulty: 'medium'
            }
        ],
        test: [
            {
                text: 'What is the main idea of a passage called?',
                options: ['Topic sentence', 'Thesis statement', 'Main idea', 'Conclusion'],
                correctOption: 2,
                hint: 'It\'s what the passage is primarily about.',
                explanation: 'The main idea is the central point the author wants to convey.',
                difficulty: 'easy'
            }
        ]
    }
};

const courses = [
    { code: 'CHM 101', name: 'General Chemistry I', faculty: 'Technology', semester: 'first', level: '100' },
    { code: 'CHM 102', name: 'General Chemistry II', faculty: 'Technology', semester: 'second', level: '100' },
    { code: 'MTH 101', name: 'Elementary Mathematics I', faculty: 'Technology', semester: 'first', level: '100' },
    { code: 'MTH 102', name: 'Elementary Mathematics II', faculty: 'Technology', semester: 'second', level: '100' },
    { code: 'PHY 101', name: 'General Physics I', faculty: 'Technology', semester: 'first', level: '100' },
    { code: 'PHY 102', name: 'General Physics II', faculty: 'Technology', semester: 'second', level: '100' },
    { code: 'GST 111', name: 'Use of English I', faculty: 'Technology', semester: 'first', level: '100' },
    { code: 'GST 112', name: 'Use of English II', faculty: 'Technology', semester: 'second', level: '100' },
    { code: 'COS 101', name: 'Introduction to Computing', faculty: 'Technology', semester: 'first', level: '100' },
    { code: 'COS 102', name: 'Programming Fundamentals', faculty: 'Technology', semester: 'second', level: '100' }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Question.deleteMany({});
        await Course.deleteMany({});
        console.log('✅ Cleared existing questions and courses');

        // Seed courses
        for (const course of courses) {
            await Course.findOneAndUpdate(
                { code: course.code },
                course,
                { upsert: true, new: true }
            );
        }
        console.log(`✅ Seeded ${courses.length} courses`);

        // Seed questions
        let questionCount = 0;
        for (const [courseCode, modes] of Object.entries(sampleQuestions)) {
            for (const [mode, questions] of Object.entries(modes)) {
                for (const q of questions) {
                    await Question.create({
                        courseCode,
                        mode,
                        ...q
                    });
                    questionCount++;
                }
            }
        }
        console.log(`✅ Seeded ${questionCount} questions`);

        console.log('🎉 Database seeded successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedDatabase();
