require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');

const questions = [
    // CHM 101 - EXAM
    { courseCode: 'CHM 101', mode: 'exam', text: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correctOption: 1, explanation: 'Carbon has 6 protons, atomic number = 6.' },
    { courseCode: 'CHM 101', mode: 'exam', text: 'Which element is a noble gas?', options: ['Oxygen', 'Nitrogen', 'Helium', 'Hydrogen'], correctOption: 2, explanation: 'Helium has a full valence shell.' },
    { courseCode: 'CHM 101', mode: 'exam', text: 'What is the pH of pure water?', options: ['0', '5', '7', '14'], correctOption: 2, explanation: 'Pure water is neutral, pH = 7.' },
    { courseCode: 'CHM 101', mode: 'exam', text: 'Molar mass of H₂O is? (H=1, O=16)', options: ['16', '17', '18', '20'], correctOption: 2, explanation: '(2×1) + 16 = 18 g/mol.' },
    { courseCode: 'CHM 101', mode: 'exam', text: 'Which bond involves electron sharing?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], correctOption: 1, explanation: 'Covalent bonds share electrons.' },
    { courseCode: 'CHM 101', mode: 'exam', text: 'What gas is produced in photosynthesis?', options: ['CO₂', 'N₂', 'O₂', 'H₂'], correctOption: 2, explanation: 'Plants produce oxygen during photosynthesis.' },
    { courseCode: 'CHM 101', mode: 'exam', text: 'Which is an alkali metal?', options: ['Calcium', 'Sodium', 'Iron', 'Zinc'], correctOption: 1, explanation: 'Sodium (Na) is in Group 1 - alkali metals.' },
    { courseCode: 'CHM 101', mode: 'exam', text: 'What is Avogadro\'s number?', options: ['6.02×10²²', '6.02×10²³', '3.01×10²³', '1.20×10²⁴'], correctOption: 1, explanation: '6.02×10²³ particles per mole.' },

    // CHM 101 - TEST
    { courseCode: 'CHM 101', mode: 'test', text: 'Which element has symbol "Na"?', options: ['Nitrogen', 'Sodium', 'Neon', 'Nickel'], correctOption: 1, hint: 'Found in table salt.', explanation: 'Na comes from Latin "natrium".' },
    { courseCode: 'CHM 101', mode: 'test', text: 'What type of reaction is burning?', options: ['Synthesis', 'Decomposition', 'Combustion', 'Precipitation'], correctOption: 2, hint: 'It involves oxygen and releases heat.', explanation: 'Combustion is rapid reaction with oxygen.' },

    // MTH 101 - EXAM
    { courseCode: 'MTH 101', mode: 'exam', text: 'Derivative of x² is?', options: ['x', '2x', 'x²', '2'], correctOption: 1, explanation: 'Power rule: d/dx(xⁿ) = nxⁿ⁻¹.' },
    { courseCode: 'MTH 101', mode: 'exam', text: 'Value of sin(90°)?', options: ['0', '0.5', '1', '-1'], correctOption: 2, explanation: 'sin(90°) = 1.' },
    { courseCode: 'MTH 101', mode: 'exam', text: 'If A={1,2}, B={2,3}, A∩B=?', options: ['{1}', '{2}', '{3}', '{1,3}'], correctOption: 1, explanation: 'Intersection = common elements.' },
    { courseCode: 'MTH 101', mode: 'exam', text: '∫2x dx = ?', options: ['x²', 'x²+C', '2x²+C', 'x+C'], correctOption: 1, explanation: '∫2x dx = x² + C.' },

    // MTH 101 - TEST
    { courseCode: 'MTH 101', mode: 'test', text: 'Limit of 1/x as x→∞?', options: ['0', '1', '∞', '-1'], correctOption: 0, hint: 'As denominator gets larger...', explanation: '1/∞ approaches 0.' },

    // GST 111 - EXAM
    { courseCode: 'GST 111', mode: 'exam', text: 'Which is NOT a part of speech?', options: ['Noun', 'Verb', 'Paragraph', 'Adjective'], correctOption: 2, explanation: 'Paragraph is a writing unit.' },
    { courseCode: 'GST 111', mode: 'exam', text: 'Synonym of "happy"?', options: ['Sad', 'Joyful', 'Angry', 'Tired'], correctOption: 1, explanation: 'Joyful = happy.' },
    { courseCode: 'GST 111', mode: 'exam', text: 'Correct sentence?', options: ['She go school', 'She goes to school', 'She going school', 'She gone school'], correctOption: 1, explanation: 'Third person singular: goes.' },

    // GST 111 - TEST
    { courseCode: 'GST 111', mode: 'test', text: 'Main idea of a passage is called?', options: ['Topic', 'Thesis', 'Main idea', 'Summary'], correctOption: 2, hint: 'It\'s what the text is about.', explanation: 'Main idea is the central point.' },

    // PHY 101 - EXAM
    { courseCode: 'PHY 101', mode: 'exam', text: 'SI unit of force?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correctOption: 1, explanation: 'Force measured in Newtons.' },
    { courseCode: 'PHY 101', mode: 'exam', text: 'Value of g on Earth?', options: ['5.8 m/s²', '9.8 m/s²', '12.8 m/s²', '15.8 m/s²'], correctOption: 1, explanation: 'g ≈ 9.8 m/s².' },
    { courseCode: 'PHY 101', mode: 'exam', text: 'Newton\'s Third Law?', options: ['Inertia', 'F=ma', 'Action-Reaction', 'Gravity'], correctOption: 2, explanation: 'Every action has equal opposite reaction.' },

    // PHY 101 - TEST
    { courseCode: 'PHY 101', mode: 'test', text: 'Energy of motion is?', options: ['Potential', 'Kinetic', 'Thermal', 'Chemical'], correctOption: 1, hint: 'Moving objects have this.', explanation: 'Kinetic energy = energy of motion.' },
];

async function addQuestions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        let added = 0;
        for (const q of questions) {
            const exists = await Question.findOne({ courseCode: q.courseCode, mode: q.mode, text: q.text });
            if (!exists) {
                await Question.create(q);
                added++;
                console.log(`✅ Added: ${q.courseCode} - ${q.text.substring(0, 40)}...`);
            }
        }

        console.log(`\n🎉 Total new questions added: ${added}`);
        console.log(`📊 Total existing (skipped): ${questions.length - added}`);
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addQuestions();
