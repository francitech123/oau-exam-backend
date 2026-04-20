const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'OAU Exam Plug API', status: 'running', version: '3.0.0' }));
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ==================== ALL 13 FACULTIES + HEALTH SCIENCES ====================
const FACULTIES = [
    'Agriculture', 'Arts', 'Law', 'Science', 'Social Sciences', 
    'Education', 'Pharmacy', 'Technology', 'Administration', 
    'Environmental Design and Management', 'Basic Medical Sciences', 
    'Clinical Sciences', 'Dentistry'
];

// ==================== MODELS ====================
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, sparse: true },
    password: { type: String, required: true },
    faculty: { type: String, required: true, enum: FACULTIES },
    department: { type: String, required: true },
    level: { type: String, required: true, enum: ['100', '200', '300', '400', '500', '600'] },
    securityQuestion: String,
    securityAnswer: String,
    isAdmin: { type: Boolean, default: false },
    examsTaken: { type: Number, default: 0 },
    testsTaken: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    studyGoals: { type: Number, default: 10 },
    achievements: [{ name: String, description: String, dateEarned: { type: Date, default: Date.now } }],
    scores: [{ course: String, score: Number, totalQuestions: Number, percentage: Number, mode: String, date: { type: Date, default: Date.now } }],
    preferences: { darkMode: { type: Boolean, default: true } },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const examQuestionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true },
    courseName: String,
    faculty: { type: String, required: true, enum: FACULTIES },
    level: { type: String, required: true },
    semester: { type: String, enum: ['first', 'second'] },
    mode: { type: String, default: 'exam' },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true, min: 0, max: 3 },
    explanation: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    createdAt: { type: Date, default: Date.now }
});

const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

const testQuestionSchema = new mongoose.Schema({
    courseCode: { type: String, required: true },
    courseName: String,
    faculty: { type: String, required: true, enum: FACULTIES },
    level: { type: String, required: true },
    semester: { type: String, enum: ['first', 'second'] },
    mode: { type: String, default: 'test' },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true, min: 0, max: 3 },
    explanation: String,
    hint: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    createdAt: { type: Date, default: Date.now }
});

const TestQuestion = mongoose.model('TestQuestion', testQuestionSchema);

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    message: String,
    type: { type: String, enum: ['success', 'info', 'warning', 'achievement'] },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

const aiKnowledgeSchema = new mongoose.Schema({
    topic: String,
    keywords: [String],
    response: String,
    usageCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const AIKnowledge = mongoose.model('AIKnowledge', aiKnowledgeSchema);

// ==================== COURSE DATABASE ====================
const COURSES = {
    // GST courses available to ALL faculties
    GST: {
        100: { first: ['GST 111'], second: ['GST 112'] }
    },
    Agriculture: {
        100: { first: ['AGR 101', 'AGR 103', 'GST 111'], second: ['AGR 102', 'AGR 104', 'GST 112'] },
        200: { first: ['AGR 201', 'AGR 203'], second: ['AGR 202', 'AGR 204'] },
        300: { first: ['AGR 301', 'AGR 303'], second: ['AGR 302', 'AGR 304'] },
        400: { first: ['AGR 401', 'AGR 403'], second: ['AGR 402', 'AGR 404'] },
        500: { first: ['AGR 501'], second: ['AGR 502'] }
    },
    Arts: {
        100: { first: ['ENG 101', 'PHL 101', 'GST 111'], second: ['ENG 102', 'PHL 102', 'GST 112'] },
        200: { first: ['ENG 201', 'PHL 201'], second: ['ENG 202', 'PHL 202'] },
        300: { first: ['ENG 301', 'PHL 301'], second: ['ENG 302', 'PHL 302'] },
        400: { first: ['ENG 401'], second: ['ENG 402'] }
    },
    Law: {
        100: { first: ['JIL 101', 'GST 111'], second: ['JIL 102', 'GST 112'] },
        200: { first: ['JIL 201', 'PPL 201'], second: ['JIL 202', 'PPL 202'] },
        300: { first: ['JIL 301', 'CRL 301'], second: ['JIL 302', 'CRL 302'] },
        400: { first: ['JIL 401', 'CML 401'], second: ['JIL 402', 'CML 402'] },
        500: { first: ['JIL 501'], second: ['JIL 502'] }
    },
    Science: {
        100: { first: ['BIO 101', 'CHM 101', 'MTH 101', 'PHY 101', 'GST 111'], second: ['BIO 102', 'CHM 102', 'MTH 102', 'PHY 102', 'GST 112'] },
        200: { first: ['BIO 201', 'CHM 201', 'MTH 201', 'PHY 201'], second: ['BIO 202', 'CHM 202', 'MTH 202', 'PHY 202'] },
        300: { first: ['BIO 301', 'CHM 301', 'MTH 301', 'PHY 301'], second: ['BIO 302', 'CHM 302', 'MTH 302', 'PHY 302'] },
        400: { first: ['BIO 401', 'CHM 401'], second: ['BIO 402', 'CHM 402'] }
    },
    'Social Sciences': {
        100: { first: ['ECO 101', 'POL 101', 'SOC 101', 'GST 111'], second: ['ECO 102', 'POL 102', 'SOC 102', 'GST 112'] },
        200: { first: ['ECO 201', 'POL 201', 'SOC 201'], second: ['ECO 202', 'POL 202', 'SOC 202'] },
        300: { first: ['ECO 301', 'POL 301', 'SOC 301'], second: ['ECO 302', 'POL 302', 'SOC 302'] },
        400: { first: ['ECO 401'], second: ['ECO 402'] }
    },
    Education: {
        100: { first: ['EDU 101', 'EDC 101', 'GST 111'], second: ['EDU 102', 'EDC 102', 'GST 112'] },
        200: { first: ['EDU 201', 'EDC 201'], second: ['EDU 202', 'EDC 202'] },
        300: { first: ['EDU 301', 'EDC 301'], second: ['EDU 302', 'EDC 302'] },
        400: { first: ['EDU 401'], second: ['EDU 402'] }
    },
    Pharmacy: {
        100: { first: ['PCL 101', 'PCH 101', 'GST 111'], second: ['PCL 102', 'PCH 102', 'GST 112'] },
        200: { first: ['PCL 201', 'PCH 201', 'PCO 201'], second: ['PCL 202', 'PCH 202', 'PCO 202'] },
        300: { first: ['PCL 301', 'PCH 301', 'PCO 301'], second: ['PCL 302', 'PCH 302', 'PCO 302'] },
        400: { first: ['PCL 401', 'PCH 401'], second: ['PCL 402', 'PCH 402'] },
        500: { first: ['PCL 501'], second: ['PCL 502'] }
    },
    Technology: {
        100: { first: ['CHM 101', 'MTH 101', 'PHY 101', 'PHY 103', 'GST 111'], second: ['CHM 102', 'MTH 102', 'PHY 102', 'PHY 104', 'GST 112'] },
        200: { first: ['CSC 201', 'EEE 201', 'MEE 201', 'CVE 201'], second: ['CSC 202', 'EEE 202', 'MEE 202', 'CVE 202'] },
        300: { first: ['CSC 301', 'EEE 301', 'MEE 301', 'CVE 301'], second: ['CSC 302', 'EEE 302', 'MEE 302', 'CVE 302'] },
        400: { first: ['CSC 401', 'EEE 401', 'MEE 401', 'CVE 401'], second: ['CSC 402', 'EEE 402', 'MEE 402', 'CVE 402'] },
        500: { first: ['CSC 501', 'EEE 501', 'MEE 501', 'CVE 501'], second: ['CSC 502', 'EEE 502', 'MEE 502', 'CVE 502'] }
    },
    Administration: {
        100: { first: ['BUS 101', 'ACC 101', 'GST 111'], second: ['BUS 102', 'ACC 102', 'GST 112'] },
        200: { first: ['BUS 201', 'ACC 201', 'FIN 201'], second: ['BUS 202', 'ACC 202', 'FIN 202'] },
        300: { first: ['BUS 301', 'ACC 301', 'FIN 301'], second: ['BUS 302', 'ACC 302', 'FIN 302'] },
        400: { first: ['BUS 401', 'ACC 401'], second: ['BUS 402', 'ACC 402'] }
    },
    'Environmental Design and Management': {
        100: { first: ['ARC 101', 'URP 101', 'GST 111'], second: ['ARC 102', 'URP 102', 'GST 112'] },
        200: { first: ['ARC 201', 'URP 201', 'QSV 201'], second: ['ARC 202', 'URP 202', 'QSV 202'] },
        300: { first: ['ARC 301', 'URP 301', 'QSV 301'], second: ['ARC 302', 'URP 302', 'QSV 302'] },
        400: { first: ['ARC 401', 'URP 401'], second: ['ARC 402', 'URP 402'] },
        500: { first: ['ARC 501'], second: ['ARC 502'] }
    },
    'Basic Medical Sciences': {
        100: { first: ['ANA 101', 'PHS 101', 'BCH 101', 'GST 111'], second: ['ANA 102', 'PHS 102', 'BCH 102', 'GST 112'] },
        200: { first: ['ANA 201', 'PHS 201', 'BCH 201'], second: ['ANA 202', 'PHS 202', 'BCH 202'] },
        300: { first: ['ANA 301', 'PHS 301', 'BCH 301'], second: ['ANA 302', 'PHS 302', 'BCH 302'] }
    },
    'Clinical Sciences': {
        400: { first: ['MED 401', 'SUR 401', 'PED 401', 'OBS 401'], second: ['MED 402', 'SUR 402', 'PED 402', 'OBS 402'] },
        500: { first: ['MED 501', 'SUR 501', 'PED 501', 'OBS 501'], second: ['MED 502', 'SUR 502', 'PED 502', 'OBS 502'] },
        600: { first: ['MED 601', 'SUR 601', 'PED 601', 'OBS 601'], second: ['MED 602', 'SUR 602', 'PED 602', 'OBS 602'] }
    },
    Dentistry: {
        100: { first: ['DEN 101', 'ORA 101', 'GST 111'], second: ['DEN 102', 'ORA 102', 'GST 112'] },
        200: { first: ['DEN 201', 'ORA 201', 'RAD 201'], second: ['DEN 202', 'ORA 202', 'RAD 202'] },
        300: { first: ['DEN 301', 'ORA 301', 'RAD 301'], second: ['DEN 302', 'ORA 302', 'RAD 302'] },
        400: { first: ['DEN 401', 'ORA 401'], second: ['DEN 402', 'ORA 402'] },
        500: { first: ['DEN 501'], second: ['DEN 502'] },
        600: { first: ['DEN 601'], second: ['DEN 602'] }
    }
};

// Course names for display
const COURSE_NAMES = {
    // GST
    'GST 111': 'Use of English I', 'GST 112': 'Use of English II',
    // Agriculture
    'AGR 101': 'Intro to Agriculture', 'AGR 102': 'Principles of Agriculture', 'AGR 103': 'Soil Science', 'AGR 104': 'Crop Production',
    'AGR 201': 'Agricultural Economics', 'AGR 202': 'Farm Management', 'AGR 203': 'Animal Science', 'AGR 204': 'Crop Protection',
    'AGR 301': 'Agricultural Extension', 'AGR 302': 'Rural Sociology', 'AGR 303': 'Agronomy', 'AGR 304': 'Horticulture',
    'AGR 401': 'Research Methods', 'AGR 402': 'Agricultural Policy', 'AGR 403': 'Biotechnology', 'AGR 404': 'Sustainable Agriculture',
    'AGR 501': 'Advanced Agronomy', 'AGR 502': 'Agricultural Project',
    // Arts
    'ENG 101': 'Intro to Literature', 'ENG 102': 'Advanced Literature', 'PHL 101': 'Intro to Philosophy', 'PHL 102': 'Logic',
    'ENG 201': 'African Literature', 'ENG 202': 'Modern Poetry', 'PHL 201': 'Ethics', 'PHL 202': 'Metaphysics',
    'ENG 301': 'Shakespeare', 'ENG 302': 'Literary Theory', 'PHL 301': 'Political Philosophy', 'PHL 302': 'Epistemology',
    'ENG 401': 'Research Project', 'ENG 402': 'Contemporary Literature',
    // Law
    'JIL 101': 'Legal Methods', 'JIL 102': 'Nigerian Legal System', 'JIL 201': 'Constitutional Law', 'JIL 202': 'Contract Law',
    'PPL 201': 'Public Law', 'PPL 202': 'Private Law', 'JIL 301': 'Criminal Law', 'JIL 302': 'Law of Torts',
    'CRL 301': 'Criminal Procedure', 'CRL 302': 'Evidence', 'JIL 401': 'Company Law', 'JIL 402': 'Commercial Law',
    'CML 401': 'Commercial Transactions', 'CML 402': 'Banking Law', 'JIL 501': 'Jurisprudence', 'JIL 502': 'International Law',
    // Science
    'BIO 101': 'General Biology I', 'BIO 102': 'General Biology II', 'CHM 101': 'General Chemistry I', 'CHM 102': 'General Chemistry II',
    'MTH 101': 'Elementary Math I', 'MTH 102': 'Elementary Math II', 'PHY 101': 'General Physics I', 'PHY 102': 'General Physics II',
    'BIO 201': 'Genetics', 'BIO 202': 'Ecology', 'CHM 201': 'Organic Chemistry I', 'CHM 202': 'Organic Chemistry II',
    'MTH 201': 'Calculus I', 'MTH 202': 'Calculus II', 'PHY 201': 'Mechanics', 'PHY 202': 'Electromagnetism',
    'BIO 301': 'Molecular Biology', 'BIO 302': 'Microbiology', 'CHM 301': 'Physical Chemistry', 'CHM 302': 'Analytical Chemistry',
    'MTH 301': 'Linear Algebra', 'MTH 302': 'Differential Equations', 'PHY 301': 'Quantum Mechanics', 'PHY 302': 'Thermodynamics',
    'BIO 401': 'Biotechnology', 'BIO 402': 'Research Project', 'CHM 401': 'Advanced Organic', 'CHM 402': 'Spectroscopy',
    // Social Sciences
    'ECO 101': 'Principles of Economics I', 'ECO 102': 'Principles of Economics II', 'POL 101': 'Intro to Politics', 'POL 102': 'Political Theory',
    'SOC 101': 'Intro to Sociology', 'SOC 102': 'Social Structure', 'ECO 201': 'Microeconomics', 'ECO 202': 'Macroeconomics',
    'POL 201': 'Nigerian Government', 'POL 202': 'Comparative Politics', 'SOC 201': 'Social Theory', 'SOC 202': 'Research Methods',
    'ECO 301': 'Development Economics', 'ECO 302': 'International Economics', 'POL 301': 'Public Administration', 'POL 302': 'International Relations',
    'SOC 301': 'Sociology of Development', 'SOC 302': 'Urban Sociology', 'ECO 401': 'Econometrics', 'ECO 402': 'Project',
    // Education
    'EDU 101': 'Intro to Education', 'EDU 102': 'Educational Psychology', 'EDC 101': 'Curriculum Studies', 'EDC 102': 'Instructional Methods',
    'EDU 201': 'Philosophy of Education', 'EDU 202': 'Sociology of Education', 'EDC 201': 'Curriculum Development', 'EDC 202': 'Educational Technology',
    'EDU 301': 'Educational Administration', 'EDU 302': 'Guidance & Counseling', 'EDC 301': 'Subject Methods', 'EDC 302': 'Assessment',
    'EDU 401': 'Teaching Practice', 'EDU 402': 'Research Project',
    // Pharmacy
    'PCL 101': 'Intro to Pharmacy', 'PCL 102': 'Pharmacy Practice', 'PCH 101': 'Pharmaceutical Chemistry I', 'PCH 102': 'Pharmaceutical Chemistry II',
    'PCL 201': 'Pharmaceutics I', 'PCL 202': 'Pharmaceutics II', 'PCH 201': 'Medicinal Chemistry', 'PCH 202': 'Drug Analysis',
    'PCO 201': 'Pharmacognosy I', 'PCO 202': 'Pharmacognosy II', 'PCL 301': 'Biopharmaceutics', 'PCL 302': 'Pharmacokinetics',
    'PCH 301': 'Advanced Medicinal', 'PCH 302': 'Pharmaceutical Analysis', 'PCO 301': 'Natural Products', 'PCO 302': 'Herbal Medicine',
    'PCL 401': 'Clinical Pharmacy', 'PCL 402': 'Pharmacy Management', 'PCH 401': 'Drug Design', 'PCH 402': 'Quality Control',
    'PCL 501': 'Pharmacy Project', 'PCL 502': 'Internship',
    // Technology
    'PHY 103': 'Physics for Eng I', 'PHY 104': 'Physics for Eng II',
    'CSC 201': 'Computer Programming I', 'CSC 202': 'Computer Programming II', 'EEE 201': 'Circuit Theory I', 'EEE 202': 'Circuit Theory II',
    'MEE 201': 'Engineering Mechanics', 'MEE 202': 'Strength of Materials', 'CVE 201': 'Engineering Drawing', 'CVE 202': 'Fluid Mechanics',
    'CSC 301': 'Data Structures', 'CSC 302': 'Algorithms', 'EEE 301': 'Electronics I', 'EEE 302': 'Electronics II',
    'MEE 301': 'Thermodynamics', 'MEE 302': 'Heat Transfer', 'CVE 301': 'Structural Analysis', 'CVE 302': 'Geotechnical Engineering',
    'CSC 401': 'Database Systems', 'CSC 402': 'Software Engineering', 'EEE 401': 'Power Systems', 'EEE 402': 'Control Systems',
    'MEE 401': 'Machine Design', 'MEE 402': 'Manufacturing', 'CVE 401': 'Reinforced Concrete', 'CVE 402': 'Steel Structures',
    'CSC 501': 'Artificial Intelligence', 'CSC 502': 'Project', 'EEE 501': 'Power Electronics', 'EEE 502': 'Project',
    'MEE 501': 'Mechatronics', 'MEE 502': 'Project', 'CVE 501': 'Foundation Engineering', 'CVE 502': 'Project',
    // Administration
    'BUS 101': 'Intro to Business', 'BUS 102': 'Business Environment', 'ACC 101': 'Intro to Accounting', 'ACC 102': 'Financial Accounting',
    'BUS 201': 'Management Principles', 'BUS 202': 'Organizational Behavior', 'ACC 201': 'Cost Accounting', 'ACC 202': 'Management Accounting',
    'FIN 201': 'Intro to Finance', 'FIN 202': 'Corporate Finance', 'BUS 301': 'Human Resource Management', 'BUS 302': 'Marketing Management',
    'ACC 301': 'Auditing', 'ACC 302': 'Taxation', 'FIN 301': 'Investment Analysis', 'FIN 302': 'Financial Markets',
    'BUS 401': 'Strategic Management', 'BUS 402': 'Business Policy', 'ACC 401': 'Advanced Accounting', 'ACC 402': 'Forensic Accounting',
    // Environmental Design
    'ARC 101': 'Intro to Architecture', 'ARC 102': 'Architectural Design', 'URP 101': 'Intro to Urban Planning', 'URP 102': 'Planning Theory',
    'ARC 201': 'Building Construction', 'ARC 202': 'Architectural Graphics', 'URP 201': 'Land Use Planning', 'URP 202': 'Transportation Planning',
    'QSV 201': 'Quantity Surveying I', 'QSV 202': 'Quantity Surveying II', 'ARC 301': 'Environmental Design', 'ARC 302': 'Housing',
    'URP 301': 'Regional Planning', 'URP 302': 'Urban Design', 'QSV 301': 'Cost Estimation', 'QSV 302': 'Contract Administration',
    'ARC 401': 'Design Studio', 'ARC 402': 'Professional Practice', 'URP 401': 'Planning Law', 'URP 402': 'Project',
    'ARC 501': 'Thesis', 'ARC 502': 'Final Project',
    // Basic Medical Sciences
    'ANA 101': 'Gross Anatomy I', 'ANA 102': 'Gross Anatomy II', 'PHS 101': 'Physiology I', 'PHS 102': 'Physiology II',
    'BCH 101': 'Biochemistry I', 'BCH 102': 'Biochemistry II', 'ANA 201': 'Histology', 'ANA 202': 'Embryology',
    'PHS 201': 'Cardiovascular Physiology', 'PHS 202': 'Respiratory Physiology', 'BCH 201': 'Metabolism', 'BCH 202': 'Molecular Biology',
    'ANA 301': 'Neuroanatomy', 'ANA 302': 'Clinical Anatomy', 'PHS 301': 'Endocrinology', 'PHS 302': 'Renal Physiology',
    'BCH 301': 'Clinical Biochemistry', 'BCH 302': 'Enzymology',
    // Clinical Sciences
    'MED 401': 'Internal Medicine I', 'MED 402': 'Internal Medicine II', 'SUR 401': 'General Surgery I', 'SUR 402': 'General Surgery II',
    'PED 401': 'Pediatrics I', 'PED 402': 'Pediatrics II', 'OBS 401': 'Obstetrics I', 'OBS 402': 'Gynecology I',
    'MED 501': 'Cardiology', 'MED 502': 'Neurology', 'SUR 501': 'Orthopedics', 'SUR 502': 'Urology',
    'PED 501': 'Neonatology', 'PED 502': 'Pediatric Emergencies', 'OBS 501': 'Obstetrics II', 'OBS 502': 'Gynecology II',
    'MED 601': 'Senior Clerkship', 'MED 602': 'Final Clinical', 'SUR 601': 'Surgical Clerkship', 'SUR 602': 'Final Surgical',
    'PED 601': 'Pediatric Clerkship', 'PED 602': 'Final Pediatrics', 'OBS 601': 'OB/GYN Clerkship', 'OBS 602': 'Final OB/GYN',
    // Dentistry
    'DEN 101': 'Intro to Dentistry', 'DEN 102': 'Dental Anatomy', 'ORA 101': 'Oral Biology', 'ORA 102': 'Oral Histology',
    'DEN 201': 'Restorative Dentistry', 'DEN 202': 'Prosthodontics', 'ORA 201': 'Oral Pathology', 'ORA 202': 'Oral Medicine',
    'RAD 201': 'Dental Radiology', 'RAD 202': 'Oral Radiology', 'DEN 301': 'Endodontics', 'DEN 302': 'Periodontics',
    'ORA 301': 'Oral Surgery', 'ORA 302': 'Oral Diagnosis', 'RAD 301': 'Advanced Radiology', 'RAD 302': 'Radiographic Interpretation',
    'DEN 401': 'Pediatric Dentistry', 'DEN 402': 'Orthodontics', 'ORA 401': 'Maxillofacial Surgery', 'ORA 402': 'Oral Rehabilitation',
    'DEN 501': 'Community Dentistry', 'DEN 502': 'Dental Public Health', 'DEN 601': 'Clinical Practice', 'DEN 602': 'Final Project'
};

// ==================== FORCE CLEAR USERS ====================
async function forceClearUsers() {
    try {
        await User.deleteMany({});
        await Notification.deleteMany({});
        console.log('✅ ALL USERS CLEARED - Fresh database!');
    } catch (e) { console.error('Clear users error:', e.message); }
}

// ==================== SEED QUESTIONS ====================
async function seedQuestions() {
    try {
        const count = await ExamQuestion.countDocuments();
        if (count > 0) return;

        for (const faculty of FACULTIES) {
            const courses = COURSES[faculty] || {};
            for (const level of ['100', '200', '300', '400', '500', '600']) {
                const levelCourses = courses[level] || { first: [], second: [] };
                for (const semester of ['first', 'second']) {
                    for (const courseCode of levelCourses[semester] || []) {
                        const exists = await ExamQuestion.findOne({ courseCode });
                        if (!exists) {
                            await ExamQuestion.create([
                                { courseCode, courseName: COURSE_NAMES[courseCode] || courseCode, faculty, level, semester, mode: 'exam', text: `${courseCode}: Sample exam question 1 - ${COURSE_NAMES[courseCode] || ''}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0, explanation: 'This is a sample explanation.', difficulty: 'easy' },
                                { courseCode, courseName: COURSE_NAMES[courseCode] || courseCode, faculty, level, semester, mode: 'exam', text: `${courseCode}: Sample exam question 2 - ${COURSE_NAMES[courseCode] || ''}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 1, explanation: 'This is a sample explanation.', difficulty: 'medium' }
                            ]);
                            await TestQuestion.create([
                                { courseCode, courseName: COURSE_NAMES[courseCode] || courseCode, faculty, level, semester, mode: 'test', text: `${courseCode}: Sample test question 1 - ${COURSE_NAMES[courseCode] || ''}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0, hint: 'Think carefully about the concept.', explanation: 'This is a sample explanation.', difficulty: 'easy' },
                                { courseCode, courseName: COURSE_NAMES[courseCode] || courseCode, faculty, level, semester, mode: 'test', text: `${courseCode}: Sample test question 2 - ${COURSE_NAMES[courseCode] || ''}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 1, hint: 'Consider all possibilities.', explanation: 'This is a sample explanation.', difficulty: 'medium' }
                            ]);
                        }
                    }
                }
            }
        }
        console.log('✅ Questions seeded for all 13 faculties + Health Sciences');
    } catch (e) { console.error('Seed error:', e.message); }
}

// ==================== SEED AI KNOWLEDGE ====================
async function seedAIKnowledge() {
    try {
        const count = await AIKnowledge.countDocuments();
        if (count > 0) return;

        await AIKnowledge.create([
            { topic: 'OAU Faculties', keywords: ['faculty', 'faculties', 'department', 'agriculture', 'arts', 'law', 'science', 'social sciences', 'education', 'pharmacy', 'technology', 'administration', 'environmental', 'medical', 'dental', 'clinical'], response: 'OAU has 13 faculties: Agriculture, Arts, Law, Science, Social Sciences, Education, Pharmacy, Technology, Administration, Environmental Design and Management, and the College of Health Sciences (Basic Medical Sciences, Clinical Sciences, Dentistry).' },
            { topic: 'Study Tips', keywords: ['study', 'learn', 'exam', 'test', 'prepare', 'revision', 'memory', 'focus'], response: 'Effective study: Active recall (test yourself), spaced repetition (review at intervals), Pomodoro technique (25 min study, 5 min break), teach others, and get adequate sleep before exams.' },
            { topic: 'GST', keywords: ['gst', 'general studies', 'english', 'communication', 'use of english'], response: 'GST 111 and 112 focus on English language, communication skills, and general knowledge. Practice essay writing and comprehension.' }
        ]);
        console.log('✅ AI Knowledge seeded');
    } catch (e) { console.error('AI seed error:', e.message); }
}

// ==================== ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, email, password, faculty, department, level, securityQuestion, securityAnswer } = req.body;
        
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        if (!/[A-Z]/.test(password)) return res.status(400).json({ error: 'Password must contain uppercase letter' });
        if (!/[0-9]/.test(password)) return res.status(400).json({ error: 'Password must contain number' });
        if (!FACULTIES.includes(faculty)) return res.status(400).json({ error: 'Invalid faculty' });
        
        const exists = await User.findOne({ username });
        if (exists) return res.status(400).json({ error: 'Username already taken' });
        
        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({
            fullName, username, email, password: hashed, faculty, department, level,
            securityQuestion, securityAnswer: securityAnswer?.toLowerCase(),
            currentStreak: 1, lastActive: new Date()
        });
        
        await Notification.create({ user: user._id, title: '🎉 Welcome!', message: `Welcome ${fullName}! Start practicing today.`, type: 'success' });
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid username or password' });
        
        const today = new Date().toDateString();
        const last = user.lastActive?.toDateString();
        if (last !== today) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            user.currentStreak = (last === yesterday.toDateString()) ? (user.currentStreak || 0) + 1 : 1;
            user.lastActive = new Date();
            
            if (user.currentStreak === 7) {
                user.achievements.push({ name: 'Week Warrior', description: '7-day study streak!' });
                await Notification.create({ user: user._id, title: '🏆 Achievement!', message: 'Week Warrior: 7-day streak!', type: 'achievement' });
            }
            await user.save();
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { ...user.toObject(), password: undefined } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/courses', (req, res) => {
    res.json({ courses: COURSES, courseNames: COURSE_NAMES, faculties: FACULTIES });
});

app.get('/api/users/leaderboard', async (req, res) => {
    try {
        const users = await User.find({}).select('username examsTaken testsTaken scores achievements createdAt').lean();
        const leaderboard = users.map(u => {
            const scores = u.scores || [];
            const avg = scores.length ? Math.round(scores.reduce((a, b) => a + (b.percentage || 0), 0) / scores.length) : 0;
            return {
                name: u.username, examsTaken: u.examsTaken || 0, testsTaken: u.testsTaken || 0,
                overallAvg: avg, achievements: (u.achievements || []).length, registeredDate: u.createdAt
            };
        }).sort((a, b) => b.overallAvg - a.overallAvg);
        res.json({ leaderboard });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users/notifications', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const notifs = await Notification.find({ user: decoded.id }).sort({ createdAt: -1 }).limit(50);
        res.json({ notifications: notifs });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/notifications/read', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        await Notification.updateMany({ user: decoded.id, read: false }, { read: true });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { fullName, email, faculty, department, level, studyGoals, preferences } = req.body;
        const user = await User.findById(decoded.id);
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (faculty && FACULTIES.includes(faculty)) user.faculty = faculty;
        if (department) user.department = department;
        if (level) user.level = level;
        if (studyGoals) user.studyGoals = studyGoals;
        if (preferences) user.preferences = { ...user.preferences, ...preferences };
        await user.save();
        res.json({ success: true, user: { ...user.toObject(), password: undefined } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { currentPassword, newPassword } = req.body;
        
        if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
        if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain uppercase letter' });
        if (!/[0-9]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain number' });
        
        const user = await User.findById(decoded.id);
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
        
        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/exams/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        let questions = await ExamQuestion.find({ courseCode, mode: 'exam' }).limit(40);
        if (!questions.length) {
            questions = [{ text: 'Sample Question', options: ['A', 'B', 'C', 'D'], correctOption: 0, explanation: 'Sample' }];
        }
        res.json({ sessionId: Date.now().toString(), course: courseCode, mode: 'exam', timeLimit: 50, questions });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tests/session/start', async (req, res) => {
    try {
        const { courseCode } = req.body;
        let questions = await TestQuestion.find({ courseCode, mode: 'test' }).limit(30);
        if (!questions.length) {
            questions = [{ text: 'Sample Test', options: ['A', 'B', 'C', 'D'], correctOption: 0, hint: 'Think', explanation: 'Sample' }];
        }
        res.json({ sessionId: Date.now().toString(), course: courseCode, mode: 'test', timeLimit: 40, questions });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/exams/session/submit', async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id);
        
        const qIds = Object.keys(answers);
        const questions = await ExamQuestion.find({ _id: { $in: qIds } });
        let correct = 0;
        questions.forEach(q => { if (answers[q._id] === q.correctOption) correct++; });
        const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
        
        user.examsTaken = (user.examsTaken || 0) + 1;
        user.totalStudyTime = (user.totalStudyTime || 0) + Math.floor((timeSpent || 0) / 1000);
        user.scores.push({ course: courseCode, score: correct, totalQuestions: questions.length, percentage: pct, mode: 'exam' });
        
        if (user.examsTaken === 1) {
            user.achievements.push({ name: 'First Exam', description: 'Completed first exam!' });
            await Notification.create({ user: user._id, title: '🏆 Achievement!', message: 'First Exam completed!', type: 'achievement' });
        }
        if (pct >= 90) {
            user.achievements.push({ name: 'Excellence', description: 'Scored 90%+' });
            await Notification.create({ user: user._id, title: '🏆 Excellence!', message: '90%+ score!', type: 'achievement' });
        }
        
        await user.save();
        await Notification.create({ user: user._id, title: '📝 Exam Done!', message: `${pct}% in ${courseCode}`, type: 'success' });
        res.json({ score: pct, correctCount: correct, totalQuestions: questions.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tests/session/submit', async (req, res) => {
    try {
        const { courseCode, answers, timeSpent } = req.body;
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id);
        
        const qIds = Object.keys(answers);
        const questions = await TestQuestion.find({ _id: { $in: qIds } });
        let correct = 0;
        questions.forEach(q => { if (answers[q._id] === q.correctOption) correct++; });
        const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
        
        user.testsTaken = (user.testsTaken || 0) + 1;
        user.totalStudyTime = (user.totalStudyTime || 0) + Math.floor((timeSpent || 0) / 1000);
        user.scores.push({ course: courseCode, score: correct, totalQuestions: questions.length, percentage: pct, mode: 'test' });
        
        await user.save();
        await Notification.create({ user: user._id, title: '🧪 Test Done!', message: `${pct}% in ${courseCode}`, type: 'success' });
        res.json({ score: pct, correctCount: correct, totalQuestions: questions.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const lowerMsg = message.toLowerCase();
        
        const knowledge = await AIKnowledge.find({});
        let bestMatch = null, highestScore = 0;
        
        for (const k of knowledge) {
            let score = 0;
            for (const kw of k.keywords) if (lowerMsg.includes(kw.toLowerCase())) score += 10;
            if (score > highestScore) { highestScore = score; bestMatch = k; }
        }
        
        if (bestMatch && highestScore >= 10) {
            bestMatch.usageCount = (bestMatch.usageCount || 0) + 1;
            await bestMatch.save();
            return res.json({ reply: bestMatch.response });
        }
        
        if (lowerMsg.includes('faculty') || lowerMsg.includes('faculties')) {
            return res.json({ reply: `OAU has 13 faculties: ${FACULTIES.join(', ')}. Which faculty are you interested in?` });
        }
        
        res.json({ reply: "I'm ExamPlugAI by Francistech! Ask me about OAU faculties, courses, study tips, or exam strategies." });
    } catch (e) { res.json({ reply: "I'm here to help! Ask me anything about your studies." }); }
});

// ==================== ADMIN ENDPOINTS ====================
const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id);
        if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin required' });
        next();
    } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
};

app.post('/api/admin/questions/exam', adminAuth, async (req, res) => {
    try {
        const question = await ExamQuestion.create(req.body);
        res.json({ success: true, question });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/questions/test', adminAuth, async (req, res) => {
    try {
        const question = await TestQuestion.create(req.body);
        res.json({ success: true, question });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json({ count: users.length, users });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        await forceClearUsers();
        await seedQuestions();
        await seedAIKnowledge();
        app.listen(PORT, () => console.log(`🚀 Server on ${PORT}\n📚 13 Faculties + Health Sciences ready!`));
    })
    .catch(e => console.error('❌ MongoDB error:', e.message));
