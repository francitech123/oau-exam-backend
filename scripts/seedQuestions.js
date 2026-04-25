require('dotenv').config();
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    courseCode: String,
    mode: String,
    text: String,
    options: [String],
    correctOption: Number,
    hint: String,
    explanation: String
});
const Question = mongoose.model('Question', questionSchema);

const allQuestions = [
    // ==================== AGRICULTURE ====================
    { courseCode: 'AGR 101', mode: 'exam', text: 'What is agriculture?', options: ['Cultivation of crops and rearing of animals', 'Only crop production', 'Only animal husbandry', 'Fishing only'], correctOption: 0, explanation: 'Agriculture is the science of cultivating crops and rearing animals for food and other products.' },
    { courseCode: 'AGR 101', mode: 'exam', text: 'Which is NOT a branch of agriculture?', options: ['Agronomy', 'Horticulture', 'Astronomy', 'Animal Science'], correctOption: 2, explanation: 'Astronomy is the study of celestial bodies, not a branch of agriculture.' },
    { courseCode: 'AGR 101', mode: 'exam', text: 'What is agronomy?', options: ['Study of fruits', 'Study of field crops and soil management', 'Study of animals', 'Study of fish'], correctOption: 1, explanation: 'Agronomy is the science of field crop production and soil management.' },
    { courseCode: 'AGR 101', mode: 'exam', text: 'Which crop is a cereal?', options: ['Tomato', 'Maize', 'Onion', 'Pepper'], correctOption: 1, explanation: 'Maize (corn) is a cereal grain, one of the most important staple crops.' },

    { courseCode: 'AGR 102', mode: 'exam', text: 'What is crop rotation?', options: ['Growing different crops in sequence', 'Growing one crop repeatedly', 'Mixing all crops', 'Growing without soil'], correctOption: 0, explanation: 'Crop rotation is planting different crops sequentially to maintain soil health.' },
    { courseCode: 'AGR 102', mode: 'exam', text: 'Which is a cereal crop?', options: ['Tomato', 'Wheat', 'Onion', 'Pepper'], correctOption: 1, explanation: 'Wheat is a cereal grain, one of the world\'s most important staple crops.' },
    { courseCode: 'AGR 102', mode: 'exam', text: 'What is irrigation?', options: ['Artificial water application', 'Natural rainfall', 'Soil fertilization', 'Pest control'], correctOption: 0, explanation: 'Irrigation supplies water to crops through artificial means.' },
    { courseCode: 'AGR 102', mode: 'exam', text: 'What is photosynthesis?', options: ['Plants making food from sunlight', 'Water absorption', 'Root growth', 'Seed germination'], correctOption: 0, explanation: 'Photosynthesis converts sunlight, CO₂, and water into glucose for plant energy.' },

    { courseCode: 'AGR 103', mode: 'exam', text: 'What is soil composed of?', options: ['Minerals, organic matter, water, air', 'Only minerals', 'Only sand', 'Only organic matter'], correctOption: 0, explanation: 'Soil is a mixture of minerals (45%), organic matter (5%), water (25%), and air (25%).' },
    { courseCode: 'AGR 103', mode: 'exam', text: 'Which soil has the largest particles?', options: ['Clay', 'Silt', 'Sand', 'Loam'], correctOption: 2, explanation: 'Sand has the largest particles (0.05-2mm).' },
    { courseCode: 'AGR 103', mode: 'exam', text: 'What does soil pH measure?', options: ['Acidity or alkalinity', 'Temperature', 'Moisture', 'Nutrients'], correctOption: 0, explanation: 'Soil pH measures how acidic or alkaline the soil is.' },
    { courseCode: 'AGR 103', mode: 'exam', text: 'What is humus?', options: ['Decomposed organic matter', 'Type of sand', 'Clay mineral', 'Fertilizer'], correctOption: 0, explanation: 'Humus is dark, decomposed organic matter that improves soil fertility.' },

    { courseCode: 'AGR 104', mode: 'exam', text: 'What is animal husbandry?', options: ['Breeding and caring for farm animals', 'Only feeding', 'Only veterinary care', 'Only milk production'], correctOption: 0, explanation: 'Animal husbandry is the science of breeding, feeding, and caring for domestic animals.' },
    { courseCode: 'AGR 104', mode: 'exam', text: 'Which animal is a ruminant?', options: ['Pig', 'Cow', 'Chicken', 'Dog'], correctOption: 1, explanation: 'Cows are ruminants with four-chambered stomachs.' },
    { courseCode: 'AGR 104', mode: 'exam', text: 'What is poultry farming?', options: ['Raising birds for meat and eggs', 'Raising cattle', 'Fish farming', 'Bee keeping'], correctOption: 0, explanation: 'Poultry farming involves raising domesticated birds.' },
    { courseCode: 'AGR 104', mode: 'exam', text: 'What is lactation?', options: ['Milk production by mammals', 'Egg laying', 'Wool growth', 'Meat production'], correctOption: 0, explanation: 'Lactation is the secretion of milk from mammary glands.' },

    // ==================== ARTS ====================
    { courseCode: 'ENG 101', mode: 'exam', text: 'What is literature?', options: ['Written works of artistic value', 'Only poetry', 'Only novels', 'Scientific papers'], correctOption: 0, explanation: 'Literature refers to written works valued for their artistic merit.' },
    { courseCode: 'ENG 101', mode: 'exam', text: 'Who wrote Things Fall Apart?', options: ['Wole Soyinka', 'Chinua Achebe', 'Ngugi wa Thiong\'o', 'Chimamanda Adichie'], correctOption: 1, explanation: 'Chinua Achebe wrote Things Fall Apart in 1958.' },
    { courseCode: 'ENG 101', mode: 'exam', text: 'What is a simile?', options: ['Comparison using like or as', 'Direct comparison', 'Exaggeration', 'Sound repetition'], correctOption: 0, explanation: 'A simile compares two things using like or as.' },
    { courseCode: 'ENG 101', mode: 'exam', text: 'What is the main character called?', options: ['Antagonist', 'Protagonist', 'Narrator', 'Author'], correctOption: 1, explanation: 'The protagonist is the main character.' },

    { courseCode: 'ENG 102', mode: 'exam', text: 'What is poetry?', options: ['Literary expression using rhythm', 'Long prose', 'Scientific writing', 'Historical record'], correctOption: 0, explanation: 'Poetry uses aesthetic and rhythmic qualities of language.' },
    { courseCode: 'ENG 102', mode: 'exam', text: 'What is a metaphor?', options: ['Direct comparison without like/as', 'Comparison using like', 'Exaggeration', 'Sound repetition'], correctOption: 0, explanation: 'A metaphor directly equates two unlike things.' },
    { courseCode: 'ENG 102', mode: 'exam', text: 'Who wrote The Lion and the Jewel?', options: ['Wole Soyinka', 'Chinua Achebe', 'J.P. Clark', 'Ngugi wa Thiong\'o'], correctOption: 0, explanation: 'Wole Soyinka wrote The Lion and the Jewel.' },
    { courseCode: 'ENG 102', mode: 'exam', text: 'What is the climax of a story?', options: ['Turning point of highest tension', 'Beginning', 'Ending', 'Character introduction'], correctOption: 0, explanation: 'The climax is the point of greatest tension.' },

    { courseCode: 'PHL 101', mode: 'exam', text: 'What does philosophy mean?', options: ['Love of wisdom', 'Study of science', 'Love of art', 'Study of history'], correctOption: 0, explanation: 'Philosophy comes from Greek philo (love) and sophia (wisdom).' },
    { courseCode: 'PHL 101', mode: 'exam', text: 'Who is the father of Western philosophy?', options: ['Socrates', 'Aristotle', 'Plato', 'Descartes'], correctOption: 0, explanation: 'Socrates is considered the father of Western philosophy.' },
    { courseCode: 'PHL 101', mode: 'exam', text: 'What is epistemology?', options: ['Study of knowledge', 'Study of reality', 'Study of morality', 'Study of beauty'], correctOption: 0, explanation: 'Epistemology is the theory of knowledge.' },
    { courseCode: 'PHL 101', mode: 'exam', text: 'What is ethics?', options: ['Study of moral principles', 'Study of existence', 'Study of reasoning', 'Study of government'], correctOption: 0, explanation: 'Ethics deals with right and wrong conduct.' },

    { courseCode: 'PHL 102', mode: 'exam', text: 'What is a syllogism?', options: ['Logical argument with two premises', 'A fallacy', 'Mathematical proof', 'Scientific method'], correctOption: 0, explanation: 'A syllogism is deductive reasoning with premises and conclusion.' },
    { courseCode: 'PHL 102', mode: 'exam', text: 'What is a fallacy?', options: ['Error in reasoning', 'True statement', 'Math error', 'Scientific law'], correctOption: 0, explanation: 'A fallacy is a flaw in reasoning that weakens an argument.' },
    { courseCode: 'PHL 102', mode: 'exam', text: 'What is deductive reasoning?', options: ['General to specific', 'Specific to general', 'Guesswork', 'Random thinking'], correctOption: 0, explanation: 'Deductive reasoning moves from general premises to specific conclusions.' },
    { courseCode: 'PHL 102', mode: 'exam', text: 'What is an argument in logic?', options: ['Statements supporting a conclusion', 'A fight', 'An opinion', 'A question'], correctOption: 0, explanation: 'In logic, an argument consists of premises supporting a conclusion.' },

    { courseCode: 'HIS 101', mode: 'exam', text: 'When did Nigeria gain independence?', options: ['1958', '1960', '1963', '1970'], correctOption: 1, explanation: 'Nigeria gained independence on October 1, 1960.' },
    { courseCode: 'HIS 101', mode: 'exam', text: 'Who was Nigeria\'s first president?', options: ['Nnamdi Azikiwe', 'Obafemi Awolowo', 'Tafawa Balewa', 'Ahmadu Bello'], correctOption: 0, explanation: 'Dr. Nnamdi Azikiwe became first President in 1963.' },
    { courseCode: 'HIS 101', mode: 'exam', text: 'What was the Nigerian Civil War about?', options: ['Biafran secession', 'Oil prices', 'Religious conflict', 'Colonial independence'], correctOption: 0, explanation: 'The Civil War (1967-1970) was over Biafra\'s attempted secession.' },
    { courseCode: 'HIS 101', mode: 'exam', text: 'When did Abuja become capital?', options: ['1976', '1980', '1991', '1999'], correctOption: 2, explanation: 'Abuja became capital on December 12, 1991.' },

    { courseCode: 'HIS 102', mode: 'exam', text: 'When did WWII end?', options: ['1943', '1944', '1945', '1946'], correctOption: 2, explanation: 'WWII ended in 1945.' },
    { courseCode: 'HIS 102', mode: 'exam', text: 'Who discovered America in 1492?', options: ['Vasco da Gama', 'Christopher Columbus', 'Magellan', 'Vespucci'], correctOption: 1, explanation: 'Columbus reached the Americas in 1492.' },
    { courseCode: 'HIS 102', mode: 'exam', text: 'What was the Cold War?', options: ['Tension between USA and USSR', 'War in cold regions', 'Economic depression', 'Nuclear war'], correctOption: 0, explanation: 'Cold War was tension between US and Soviet Union (1947-1991).' },
    { courseCode: 'HIS 102', mode: 'exam', text: 'When did French Revolution begin?', options: ['1776', '1789', '1804', '1815'], correctOption: 1, explanation: 'The French Revolution began in 1789.' },

    // ==================== LAW ====================
    { courseCode: 'JIL 101', mode: 'exam', text: 'What is primary source of Nigerian law?', options: ['Constitution', 'Textbooks', 'Newspapers', 'Foreign laws'], correctOption: 0, explanation: 'The Constitution is the supreme law of Nigeria.' },
    { courseCode: 'JIL 101', mode: 'exam', text: 'What does stare decisis mean?', options: ['To stand by decided matters', 'To change laws', 'To ignore precedent', 'To create laws'], correctOption: 0, explanation: 'Stare decisis means to follow precedent.' },
    { courseCode: 'JIL 101', mode: 'exam', text: 'Which is the highest court in Nigeria?', options: ['High Court', 'Court of Appeal', 'Supreme Court', 'Magistrate Court'], correctOption: 2, explanation: 'The Supreme Court is highest.' },
    { courseCode: 'JIL 101', mode: 'exam', text: 'What is common law?', options: ['Law made by judges', 'Law by parliament', 'Religious law', 'International law'], correctOption: 0, explanation: 'Common law is judge-made law through precedents.' },

    { courseCode: 'JIL 102', mode: 'exam', text: 'What is a constitution?', options: ['Supreme law of a country', 'Ordinary legislation', 'Judicial decision', 'Executive order'], correctOption: 0, explanation: 'A constitution is the fundamental supreme law.' },
    { courseCode: 'JIL 102', mode: 'exam', text: 'What is separation of powers?', options: ['Division among branches', 'Military rule', 'State division', 'Political parties'], correctOption: 0, explanation: 'Separation divides government into executive, legislature, judiciary.' },
    { courseCode: 'JIL 102', mode: 'exam', text: 'What is fundamental human right?', options: ['Basic rights for every person', 'Government privileges', 'Political favors', 'Legal permissions'], correctOption: 0, explanation: 'Fundamental rights are basic entitlements.' },
    { courseCode: 'JIL 102', mode: 'exam', text: 'What is rule of law?', options: ['Everyone subject to law', 'Only citizens follow', 'Government exempt', 'Judges make laws'], correctOption: 0, explanation: 'Rule of law means all are accountable to law.' },

    { courseCode: 'PIL 101', mode: 'exam', text: 'What is international law?', options: ['Rules between nations', 'Domestic criminal law', 'Local regulations', 'Corporate law'], correctOption: 0, explanation: 'International law governs relations between sovereign states.' },
    { courseCode: 'PIL 101', mode: 'exam', text: 'What is a treaty?', options: ['Formal agreement between states', 'Domestic statute', 'Court judgment', 'Executive order'], correctOption: 0, explanation: 'A treaty is binding international agreement.' },
    { courseCode: 'PIL 101', mode: 'exam', text: 'What is the UN Charter?', options: ['Founding UN document', 'Trade agreement', 'Military alliance', 'Environmental treaty'], correctOption: 0, explanation: 'UN Charter established the United Nations in 1945.' },
    { courseCode: 'PIL 101', mode: 'exam', text: 'What is state sovereignty?', options: ['Supreme authority over territory', 'Foreign control', 'Shared governance', 'UN rule'], correctOption: 0, explanation: 'Sovereignty means exclusive authority within borders.' },

    { courseCode: 'PIL 102', mode: 'exam', text: 'What is private international law?', options: ['Disputes with foreign elements', 'Public criminal law', 'Constitutional law', 'Administrative law'], correctOption: 0, explanation: 'Private international law deals with cross-border private disputes.' },
    { courseCode: 'PIL 102', mode: 'exam', text: 'What is conflict of laws?', options: ['Determining applicable jurisdiction', 'Military conflict', 'Criminal dispute', 'Constitutional crisis'], correctOption: 0, explanation: 'Conflict of laws determines which law applies.' },
    { courseCode: 'PIL 102', mode: 'exam', text: 'What is domicile?', options: ['Permanent legal residence', 'Temporary residence', 'Birthplace', 'Workplace'], correctOption: 0, explanation: 'Domicile is permanent legal home.' },
    { courseCode: 'PIL 102', mode: 'exam', text: 'What is choice of law?', options: ['Selecting governing law', 'Choosing lawyer', 'Picking court', 'Writing contract'], correctOption: 0, explanation: 'Choice of law determines which substantive law applies.' },

    // ==================== SCIENCE ====================
    { courseCode: 'BIO 101', mode: 'exam', text: 'What is the basic unit of life?', options: ['Cell', 'Atom', 'Molecule', 'Tissue'], correctOption: 0, explanation: 'The cell is the fundamental unit of all living organisms.' },
    { courseCode: 'BIO 101', mode: 'exam', text: 'What is photosynthesis?', options: ['Process of making food using sunlight', 'Cell division', 'Respiration', 'Digestion'], correctOption: 0, explanation: 'Plants use photosynthesis to convert sunlight into energy.' },
    { courseCode: 'BIO 101', mode: 'exam', text: 'What is DNA?', options: ['Genetic material', 'Protein', 'Carbohydrate', 'Lipid'], correctOption: 0, explanation: 'DNA carries genetic instructions for all living organisms.' },
    { courseCode: 'BIO 101', mode: 'exam', text: 'What is mitosis?', options: ['Cell division', 'Energy production', 'Protein synthesis', 'Waste removal'], correctOption: 0, explanation: 'Mitosis produces two identical daughter cells.' },

    { courseCode: 'BIO 102', mode: 'exam', text: 'What is DNA replication?', options: ['Copying DNA', 'Protein synthesis', 'Cell division', 'Energy production'], correctOption: 0, explanation: 'DNA replication produces identical DNA copies.' },
    { courseCode: 'BIO 102', mode: 'exam', text: 'What is an ecosystem?', options: ['Community of organisms and environment', 'Single species', 'Only plants', 'Only animals'], correctOption: 0, explanation: 'An ecosystem includes living organisms and their environment.' },
    { courseCode: 'BIO 102', mode: 'exam', text: 'What is natural selection?', options: ['Survival of best adapted', 'Artificial breeding', 'Random change', 'Human intervention'], correctOption: 0, explanation: 'Natural selection favors organisms best adapted to environment.' },
    { courseCode: 'BIO 102', mode: 'exam', text: 'What is homeostasis?', options: ['Stable internal environment', 'Growth', 'Reproduction', 'Movement'], correctOption: 0, explanation: 'Homeostasis maintains stable internal conditions.' },

    { courseCode: 'CHM 101', mode: 'exam', text: 'What is the atomic number of Carbon?', options: ['4', '6', '8', '12'], correctOption: 1, explanation: 'Carbon has 6 protons, atomic number = 6.' },
    { courseCode: 'CHM 101', mode: 'exam', text: 'Which is a noble gas?', options: ['Oxygen', 'Nitrogen', 'Helium', 'Hydrogen'], correctOption: 2, explanation: 'Helium is a noble gas with full valence shell.' },
    { courseCode: 'CHM 101', mode: 'exam', text: 'Molar mass of H₂O?', options: ['16', '17', '18', '20'], correctOption: 2, explanation: '(2×1) + 16 = 18 g/mol.' },
    { courseCode: 'CHM 101', mode: 'exam', text: 'What is pH of pure water?', options: ['0', '5', '7', '14'], correctOption: 2, explanation: 'Pure water is neutral, pH = 7.' },

    { courseCode: 'CHM 102', mode: 'exam', text: 'What is Avogadro\'s number?', options: ['6.02×10²²', '6.02×10²³', '3.01×10²³', '1.2×10²⁴'], correctOption: 1, explanation: '6.022×10²³ per mole.' },
    { courseCode: 'CHM 102', mode: 'exam', text: 'Which bond shares electrons?', options: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'], correctOption: 1, explanation: 'Covalent bonds share electrons.' },
    { courseCode: 'CHM 102', mode: 'exam', text: 'What is the symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctOption: 2, explanation: 'Au from Latin aurum.' },
    { courseCode: 'CHM 102', mode: 'exam', text: 'Which acid is in vinegar?', options: ['Citric', 'Acetic', 'Lactic', 'Sulfuric'], correctOption: 1, explanation: 'Acetic acid is in vinegar.' },

    { courseCode: 'MTH 101', mode: 'exam', text: 'Derivative of x²?', options: ['x', '2x', 'x²', '2'], correctOption: 1, explanation: 'd/dx(x²) = 2x.' },
    { courseCode: 'MTH 101', mode: 'exam', text: 'sin(90°)?', options: ['0', '0.5', '1', '-1'], correctOption: 2, explanation: 'sin(90°) = 1.' },
    { courseCode: 'MTH 101', mode: 'exam', text: 'A={1,2} B={2,3}, A∩B?', options: ['{1}', '{2}', '{3}', '{1,3}'], correctOption: 1, explanation: 'Common element is 2.' },
    { courseCode: 'MTH 101', mode: 'exam', text: '∫2x dx?', options: ['x²', 'x²+C', '2x²+C', 'x+C'], correctOption: 1, explanation: '∫2x dx = x² + C.' },

    { courseCode: 'MTH 102', mode: 'exam', text: 'Limit of 1/x as x→∞?', options: ['0', '1', '∞', '-1'], correctOption: 0, explanation: '1/∞ approaches 0.' },
    { courseCode: 'MTH 102', mode: 'exam', text: 'cos(0°)?', options: ['0', '0.5', '1', '-1'], correctOption: 2, explanation: 'cos(0°) = 1.' },
    { courseCode: 'MTH 102', mode: 'exam', text: 'Derivative of sin(x)?', options: ['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'], correctOption: 0, explanation: 'd/dx(sin x) = cos x.' },
    { courseCode: 'MTH 102', mode: 'exam', text: '∫cos(x) dx?', options: ['sin(x)+C', '-sin(x)+C', 'cos(x)+C', '-cos(x)+C'], correctOption: 0, explanation: '∫cos x dx = sin x + C.' },

    { courseCode: 'PHY 101', mode: 'exam', text: 'SI unit of force?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correctOption: 1, explanation: 'Force is measured in Newtons.' },
    { courseCode: 'PHY 101', mode: 'exam', text: 'Value of g on Earth?', options: ['5.8', '9.8', '12.8', '15.8'], correctOption: 1, explanation: 'g ≈ 9.8 m/s².' },
    { courseCode: 'PHY 101', mode: 'exam', text: 'Newton\'s Third Law?', options: ['Inertia', 'F=ma', 'Action-Reaction', 'Gravity'], correctOption: 2, explanation: 'Every action has equal opposite reaction.' },
    { courseCode: 'PHY 101', mode: 'exam', text: 'Energy of motion?', options: ['Potential', 'Kinetic', 'Thermal', 'Chemical'], correctOption: 1, explanation: 'Kinetic energy is energy of motion.' },

    { courseCode: 'PHY 102', mode: 'exam', text: 'Ohm\'s Law?', options: ['V=IR', 'P=IV', 'F=ma', 'E=mc²'], correctOption: 0, explanation: 'V = I × R.' },
    { courseCode: 'PHY 102', mode: 'exam', text: 'Unit of electric charge?', options: ['Coulomb', 'Ampere', 'Volt', 'Ohm'], correctOption: 0, explanation: 'Coulomb is SI unit of charge.' },
    { courseCode: 'PHY 102', mode: 'exam', text: 'What does a capacitor store?', options: ['Electric charge', 'Current', 'Resistance', 'Power'], correctOption: 0, explanation: 'A capacitor stores electric potential energy.' },
    { courseCode: 'PHY 102', mode: 'exam', text: 'Speed of light?', options: ['3×10⁶', '3×10⁸', '3×10¹⁰', '3×10⁴'], correctOption: 1, explanation: 'c ≈ 3×10⁸ m/s.' },

    { courseCode: 'PHY 103', mode: 'exam', text: 'What is ultrasound?', options: ['Sound above human hearing', 'Light waves', 'Radio waves', 'X-rays'], correctOption: 0, explanation: 'Ultrasound uses high-frequency sound waves.' },
    { courseCode: 'PHY 103', mode: 'exam', text: 'What is radiation therapy?', options: ['Using radiation to treat cancer', 'Heat treatment', 'Cold therapy', 'Massage'], correctOption: 0, explanation: 'Radiation therapy uses high-energy radiation.' },
    { courseCode: 'PHY 103', mode: 'exam', text: 'What is biomechanics?', options: ['Mechanics in living organisms', 'Chemical study', 'Weather study', 'Rock study'], correctOption: 0, explanation: 'Biomechanics applies physics to living systems.' },
    { courseCode: 'PHY 103', mode: 'exam', text: 'What is MRI?', options: ['Magnetic Resonance Imaging', 'X-ray', 'Ultrasound', 'CT scan'], correctOption: 0, explanation: 'MRI uses magnetic fields for imaging.' },

    { courseCode: 'PHY 104', mode: 'exam', text: 'What is a laser?', options: ['Focused light beam', 'Sound wave', 'Radio wave', 'Water wave'], correctOption: 0, explanation: 'Laser produces coherent light.' },
    { courseCode: 'PHY 104', mode: 'exam', text: 'What is fiber optics?', options: ['Light through glass fibers', 'Copper wire', 'Radio transmission', 'Satellite'], correctOption: 0, explanation: 'Fiber optics transmits light through thin glass fibers.' },
    { courseCode: 'PHY 104', mode: 'exam', text: 'What is nuclear medicine?', options: ['Radioactive substances for diagnosis', 'Herbal medicine', 'Surgery', 'Physical therapy'], correctOption: 0, explanation: 'Nuclear medicine uses radioactive tracers.' },
    { courseCode: 'PHY 104', mode: 'exam', text: 'What is a CT scan?', options: ['3D X-ray imaging', 'Ultrasound', 'MRI', 'Blood test'], correctOption: 0, explanation: 'CT scan creates cross-sectional images.' },

    // ==================== SOCIAL SCIENCES ====================
    { courseCode: 'ECO 101', mode: 'exam', text: 'What is economics?', options: ['Study of scarcity and choice', 'Study of money only', 'Study of politics', 'Study of history'], correctOption: 0, explanation: 'Economics studies choices under scarcity.' },
    { courseCode: 'ECO 101', mode: 'exam', text: 'What is demand?', options: ['Willingness to buy', 'Amount sold', 'Total production', 'Government spending'], correctOption: 0, explanation: 'Demand is willingness to purchase at prices.' },
    { courseCode: 'ECO 101', mode: 'exam', text: 'What is GDP?', options: ['Total value of goods/services', 'Government debt', 'Inflation rate', 'Unemployment rate'], correctOption: 0, explanation: 'GDP measures total economic output.' },
    { courseCode: 'ECO 101', mode: 'exam', text: 'What is opportunity cost?', options: ['Next best alternative forgone', 'Total cost', 'Fixed cost', 'Variable cost'], correctOption: 0, explanation: 'Opportunity cost is value of next best alternative.' },

    { courseCode: 'ECO 102', mode: 'exam', text: 'What is microeconomics?', options: ['Study of individual units', 'Whole economy', 'Global trade', 'Government spending'], correctOption: 0, explanation: 'Microeconomics studies individual consumers and firms.' },
    { courseCode: 'ECO 102', mode: 'exam', text: 'What is law of demand?', options: ['Price up, demand down', 'Price up, demand up', 'No relationship', 'Constant demand'], correctOption: 0, explanation: 'As price increases, quantity demanded decreases.' },
    { courseCode: 'ECO 102', mode: 'exam', text: 'What is elasticity?', options: ['Responsiveness to price', 'Total demand', 'Supply changes', 'Market size'], correctOption: 0, explanation: 'Elasticity measures demand response to price.' },
    { courseCode: 'ECO 102', mode: 'exam', text: 'What is market equilibrium?', options: ['Supply equals demand', 'Maximum price', 'Minimum price', 'Government price'], correctOption: 0, explanation: 'Equilibrium where quantity supplied equals demanded.' },

    { courseCode: 'POL 101', mode: 'exam', text: 'What is politics?', options: ['Collective decision making', 'Only elections', 'Only government', 'Only laws'], correctOption: 0, explanation: 'Politics is process of making group decisions.' },
    { courseCode: 'POL 101', mode: 'exam', text: 'What is democracy?', options: ['Rule by the people', 'Rule by one', 'Military rule', 'Rule by wealthy'], correctOption: 0, explanation: 'Democracy is government by the people.' },
    { courseCode: 'POL 101', mode: 'exam', text: 'Three branches of government?', options: ['Executive, Legislative, Judiciary', 'Army, Navy, Air Force', 'Federal, State, Local', 'President, Governor, Chairman'], correctOption: 0, explanation: 'Three branches provide checks and balances.' },
    { courseCode: 'POL 101', mode: 'exam', text: 'What is a constitution?', options: ['Supreme law', 'Ordinary bill', 'Executive order', 'Judicial ruling'], correctOption: 0, explanation: 'Constitution is fundamental law.' },

    { courseCode: 'POL 102', mode: 'exam', text: 'How many states in Nigeria?', options: ['30', '36', '40', '48'], correctOption: 1, explanation: 'Nigeria has 36 states and FCT.' },
    { courseCode: 'POL 102', mode: 'exam', text: 'Nigeria\'s government system?', options: ['Presidential federal', 'Parliamentary', 'Monarchy', 'Unitary'], correctOption: 0, explanation: 'Nigeria is a presidential federal republic.' },
    { courseCode: 'POL 102', mode: 'exam', text: 'Head of executive?', options: ['The President', 'Chief Justice', 'Senate President', 'Governor'], correctOption: 0, explanation: 'President heads the executive branch.' },
    { courseCode: 'POL 102', mode: 'exam', text: 'What is National Assembly?', options: ['Senate and House', 'Only Senate', 'Only House', 'State Assembly'], correctOption: 0, explanation: 'National Assembly = Senate + House of Reps.' },

    { courseCode: 'SOC 101', mode: 'exam', text: 'What is sociology?', options: ['Study of society', 'Study of individuals', 'Study of animals', 'Study of rocks'], correctOption: 0, explanation: 'Sociology studies human society and social behavior.' },
    { courseCode: 'SOC 101', mode: 'exam', text: 'What is culture?', options: ['Shared beliefs and practices', 'Only art', 'Only language', 'Only religion'], correctOption: 0, explanation: 'Culture encompasses shared norms and values.' },
    { courseCode: 'SOC 101', mode: 'exam', text: 'What is socialization?', options: ['Learning societal norms', 'Graduating', 'Getting a job', 'Voting'], correctOption: 0, explanation: 'Socialization is learning and internalizing norms.' },
    { courseCode: 'SOC 101', mode: 'exam', text: 'What is a social institution?', options: ['Established behavior patterns', 'A building', 'Government office', 'A corporation'], correctOption: 0, explanation: 'Social institutions are organized patterns (family, education).' },

    { courseCode: 'SOC 102', mode: 'exam', text: 'What is family as institution?', options: ['Primary socialization unit', 'Business', 'Government', 'Religious group'], correctOption: 0, explanation: 'Family transmits culture and socializes children.' },
    { courseCode: 'SOC 102', mode: 'exam', text: 'Function of education?', options: ['Transmit knowledge', 'Only employment', 'Only entertainment', 'Only punishment'], correctOption: 0, explanation: 'Education transmits knowledge and skills.' },
    { courseCode: 'SOC 102', mode: 'exam', text: 'What is religion as institution?', options: ['System of sacred beliefs', 'Only rituals', 'Only prayers', 'Only buildings'], correctOption: 0, explanation: 'Religion provides meaning and moral guidance.' },
    { courseCode: 'SOC 102', mode: 'exam', text: 'What is economic institution?', options: ['Production and distribution', 'Only banking', 'Only trading', 'Only farming'], correctOption: 0, explanation: 'Economy organizes production and distribution.' },

    { courseCode: 'PSY 101', mode: 'exam', text: 'What is psychology?', options: ['Study of mind and behavior', 'Study of mental illness only', 'Study of animals', 'Study of society'], correctOption: 0, explanation: 'Psychology studies mental processes and behavior.' },
    { courseCode: 'PSY 101', mode: 'exam', text: 'Father of psychoanalysis?', options: ['Sigmund Freud', 'B.F. Skinner', 'William James', 'John Watson'], correctOption: 0, explanation: 'Freud developed psychoanalysis.' },
    { courseCode: 'PSY 101', mode: 'exam', text: 'What is classical conditioning?', options: ['Learning by association', 'Learning by observation', 'Learning by punishment', 'Learning by reward'], correctOption: 0, explanation: 'Pavlov\'s dogs - stimulus association.' },
    { courseCode: 'PSY 101', mode: 'exam', text: 'What is memory?', options: ['Encoding, storing, retrieving', 'Only remembering', 'Only forgetting', 'Only learning'], correctOption: 0, explanation: 'Memory involves encoding, storage, and retrieval.' },

    { courseCode: 'PSY 102', mode: 'exam', text: 'What is developmental psychology?', options: ['Study of growth across lifespan', 'Mental illness', 'Animals', 'Social groups'], correctOption: 0, explanation: 'Studies human development from conception to death.' },
    { courseCode: 'PSY 102', mode: 'exam', text: 'Cognitive development theorist?', options: ['Jean Piaget', 'Freud', 'Skinner', 'Maslow'], correctOption: 0, explanation: 'Piaget proposed four stages of cognitive development.' },
    { courseCode: 'PSY 102', mode: 'exam', text: 'What is attachment theory?', options: ['Emotional bond with caregiver', 'Learning theory', 'Memory theory', 'Personality theory'], correctOption: 0, explanation: 'Bowlby\'s attachment theory.' },
    { courseCode: 'PSY 102', mode: 'exam', text: 'What is adolescence?', options: ['Transition to adulthood', 'Early childhood', 'Middle age', 'Old age'], correctOption: 0, explanation: 'Adolescence is ages ~10-19.' },

    // ==================== EDUCATION ====================
    { courseCode: 'EDU 101', mode: 'exam', text: 'What is education?', options: ['Acquiring knowledge and skills', 'Only schooling', 'Only reading', 'Only teaching'], correctOption: 0, explanation: 'Education facilitates learning and development.' },
    { courseCode: 'EDU 101', mode: 'exam', text: 'Father of modern education?', options: ['John Dewey', 'Socrates', 'Plato', 'Aristotle'], correctOption: 0, explanation: 'John Dewey pioneered progressive education.' },
    { courseCode: 'EDU 101', mode: 'exam', text: 'What is pedagogy?', options: ['Art of teaching', 'Study of children', 'School management', 'Curriculum design'], correctOption: 0, explanation: 'Pedagogy is the method of teaching.' },
    { courseCode: 'EDU 101', mode: 'exam', text: 'What is curriculum?', options: ['Planned course of study', 'School building', 'Teaching method', 'Examination'], correctOption: 0, explanation: 'Curriculum is planned academic content.' },

    { courseCode: 'EDU 102', mode: 'exam', text: 'What is educational psychology?', options: ['How people learn', 'Teaching only', 'Schools only', 'Exams only'], correctOption: 0, explanation: 'Applies psychology to teaching and learning.' },
    { courseCode: 'EDU 102', mode: 'exam', text: 'What is a learning style?', options: ['Preferred way of learning', 'Intelligence level', 'Test score', 'Grade point'], correctOption: 0, explanation: 'Different approaches to absorbing information.' },
    { courseCode: 'EDU 102', mode: 'exam', text: 'What is motivation?', options: ['Drive to learn', 'Test anxiety', 'Classroom size', 'Curriculum'], correctOption: 0, explanation: 'Motivation energizes learning behavior.' },
    { courseCode: 'EDU 102', mode: 'exam', text: 'What is reinforcement?', options: ['Consequence strengthening behavior', 'Punishment only', 'Ignoring', 'Forgetting'], correctOption: 0, explanation: 'Reinforcement increases behavior likelihood.' },

    { courseCode: 'EDC 101', mode: 'exam', text: 'What is a curriculum?', options: ['Planned course of study', 'School building', 'Teaching method', 'Examination system'], correctOption: 0, explanation: 'Curriculum is planned learning experiences.' },
    { courseCode: 'EDC 101', mode: 'exam', text: 'What is curriculum development?', options: ['Creating educational programs', 'Building schools', 'Hiring teachers', 'Grading'], correctOption: 0, explanation: 'Planning and implementing educational programs.' },
    { courseCode: 'EDC 101', mode: 'exam', text: 'What is a syllabus?', options: ['Outline of course topics', 'Entire school program', 'Government policy', 'Teacher certification'], correctOption: 0, explanation: 'Syllabus outlines specific course content.' },
    { courseCode: 'EDC 101', mode: 'exam', text: 'What is educational objective?', options: ['What learners should achieve', 'School rules', 'Teacher salary', 'Classroom size'], correctOption: 0, explanation: 'Objectives describe desired learning outcomes.' },

    { courseCode: 'EDC 102', mode: 'exam', text: 'What is lecture method?', options: ['Teacher-centered presentation', 'Group discussion', 'Online learning', 'Self-study'], correctOption: 0, explanation: 'Traditional teacher-centered oral presentation.' },
    { courseCode: 'EDC 102', mode: 'exam', text: 'What is demonstration?', options: ['Showing step-by-step', 'Giving speech', 'Assigning homework', 'Taking test'], correctOption: 0, explanation: 'Demonstration shows how to perform tasks.' },
    { courseCode: 'EDC 102', mode: 'exam', text: 'What is collaborative learning?', options: ['Students working together', 'Individual study', 'Teacher lecturing', 'Online testing'], correctOption: 0, explanation: 'Students working together to solve problems.' },
    { courseCode: 'EDC 102', mode: 'exam', text: 'What is assessment?', options: ['Measuring learning progress', 'Building classrooms', 'Hiring teachers', 'Creating curriculum'], correctOption: 0, explanation: 'Assessment evaluates student learning.' },

    { courseCode: 'EDP 101', mode: 'exam', text: 'What is educational planning?', options: ['Setting educational goals', 'Building schools', 'Hiring teachers', 'Grading'], correctOption: 0, explanation: 'Planning involves setting objectives and resources.' },
    { courseCode: 'EDP 101', mode: 'exam', text: 'What is manpower planning?', options: ['Forecasting HR needs', 'Curriculum design', 'Student assessment', 'School construction'], correctOption: 0, explanation: 'Predicting workforce requirements.' },
    { courseCode: 'EDP 101', mode: 'exam', text: 'What is educational policy?', options: ['Government principles', 'School rules', 'Teacher guidelines', 'Student handbook'], correctOption: 0, explanation: 'Policy guides education systems.' },
    { courseCode: 'EDP 101', mode: 'exam', text: 'What is school mapping?', options: ['Planning school locations', 'Drawing maps', 'Student registration', 'Curriculum planning'], correctOption: 0, explanation: 'Geographic planning of schools.' },

    { courseCode: 'EDP 102', mode: 'exam', text: 'What is educational administration?', options: ['Managing institutions', 'Classroom teaching', 'Curriculum design', 'Counseling'], correctOption: 0, explanation: 'Planning and directing educational institutions.' },
    { courseCode: 'EDP 102', mode: 'exam', text: 'What is school leadership?', options: ['Guiding school community', 'Only giving orders', 'Only making rules', 'Only discipline'], correctOption: 0, explanation: 'Inspiring and guiding toward goals.' },
    { courseCode: 'EDP 102', mode: 'exam', text: 'What is supervision?', options: ['Improving instruction', 'Punishing teachers', 'Firing staff', 'Budgeting only'], correctOption: 0, explanation: 'Monitoring and improving teaching.' },
    { courseCode: 'EDP 102', mode: 'exam', text: 'What is school discipline?', options: ['Maintaining order', 'Punishment only', 'Suspension only', 'Expulsion only'], correctOption: 0, explanation: 'Creating safe, orderly environment.' },

    // ==================== PHARMACY ====================
    { courseCode: 'PCY 101', mode: 'exam', text: 'What is pharmacy?', options: ['Science of medicines', 'Study of plants', 'Study of animals', 'Study of surgery'], correctOption: 0, explanation: 'Pharmacy links health and pharmaceutical sciences.' },
    { courseCode: 'PCY 101', mode: 'exam', text: 'What is a prescription?', options: ['Written order for medicine', 'OTC drug', 'Herbal remedy', 'Vitamin'], correctOption: 0, explanation: 'Prescription is written order from practitioner.' },
    { courseCode: 'PCY 101', mode: 'exam', text: 'What is pharmacology?', options: ['Study of drug interactions', 'Study of plants', 'Dosage forms', 'Manufacturing'], correctOption: 0, explanation: 'How drugs affect biological systems.' },
    { courseCode: 'PCY 101', mode: 'exam', text: 'What does OTC mean?', options: ['Over The Counter', 'On Time Care', 'Oral Tablet', 'Official Code'], correctOption: 0, explanation: 'Over The Counter - no prescription needed.' },

    { courseCode: 'PCY 102', mode: 'exam', text: 'What is pharmaceutical care?', options: ['Patient-centered practice', 'Drug manufacturing', 'Medical diagnosis', 'Surgery'], correctOption: 0, explanation: 'Optimizing health through medication.' },
    { courseCode: 'PCY 102', mode: 'exam', text: 'What is drug dispensing?', options: ['Providing medications', 'Manufacturing', 'Research', 'Marketing'], correctOption: 0, explanation: 'Giving medications with instructions.' },
    { courseCode: 'PCY 102', mode: 'exam', text: 'What is contraindication?', options: ['Drug should not be used', 'Side effect', 'Dosage', 'Interaction'], correctOption: 0, explanation: 'Situation where drug use is harmful.' },
    { courseCode: 'PCY 102', mode: 'exam', text: 'What is patient counseling?', options: ['Educating about medications', 'Selling drugs', 'Writing prescriptions', 'Manufacturing'], correctOption: 0, explanation: 'Informing patients about proper use.' },

    // ==================== TECHNOLOGY ====================
    { courseCode: 'GET 101', mode: 'exam', text: 'What is engineering drawing?', options: ['Technical design communication', 'Artistic drawing', 'Freehand sketch', 'Painting'], correctOption: 0, explanation: 'Precise graphical language for design.' },
    { courseCode: 'GET 101', mode: 'exam', text: 'What is orthographic projection?', options: ['2D views of 3D object', '3D perspective', 'Isometric only', 'Freehand'], correctOption: 0, explanation: 'Multiple 2D views of 3D object.' },
    { courseCode: 'GET 101', mode: 'exam', text: 'What is a dimension line?', options: ['Shows measurement', 'Center line', 'Hidden line', 'Construction line'], correctOption: 0, explanation: 'Indicates size or distance.' },
    { courseCode: 'GET 101', mode: 'exam', text: 'Purpose of title block?', options: ['Drawing information', 'Decoration', 'Color coding', 'Material list'], correctOption: 0, explanation: 'Contains title, scale, date.' },

    { courseCode: 'GET 102', mode: 'exam', text: 'What is isometric projection?', options: ['3D at 30° angles', '2D top view', 'Front view', 'Freehand'], correctOption: 0, explanation: '3D with axes at 30°.' },
    { courseCode: 'GET 102', mode: 'exam', text: 'What is sectional drawing?', options: ['Shows internal features', 'External only', 'Top view', 'Perspective'], correctOption: 0, explanation: 'Reveals internal details.' },
    { courseCode: 'GET 102', mode: 'exam', text: 'What does CAD stand for?', options: ['Computer-Aided Design', 'Camera And Drawing', 'Calculation And Design', 'Construction Aid'], correctOption: 0, explanation: 'CAD = Computer-Aided Design.' },
    { courseCode: 'GET 102', mode: 'exam', text: 'What is a scale drawing?', options: ['Proportional representation', 'Freehand', 'Rough draft', 'Color rendering'], correctOption: 0, explanation: 'Proportional to actual size.' },

    // ==================== ADMINISTRATION ====================
    { courseCode: 'BUS 101', mode: 'exam', text: 'What is a business?', options: ['Organization for profit', 'Government agency', 'Charity only', 'School only'], correctOption: 0, explanation: 'Organization engaged in commercial activities.' },
    { courseCode: 'BUS 101', mode: 'exam', text: 'What is entrepreneurship?', options: ['Starting a business', 'Government work', 'Studying business', 'Retirement'], correctOption: 0, explanation: 'Starting and managing a business venture.' },
    { courseCode: 'BUS 101', mode: 'exam', text: 'What is profit?', options: ['Revenue minus expenses', 'Total sales', 'Total assets', 'Market value'], correctOption: 0, explanation: 'Profit = Revenue - Expenses.' },
    { courseCode: 'BUS 101', mode: 'exam', text: 'What is marketing?', options: ['Promoting products', 'Manufacturing', 'Hiring', 'Accounting'], correctOption: 0, explanation: 'Promoting and selling products.' },

    { courseCode: 'BUS 102', mode: 'exam', text: 'What is management?', options: ['Planning and organizing', 'Only giving orders', 'Only hiring', 'Only firing'], correctOption: 0, explanation: 'Coordinating resources to achieve goals.' },
    { courseCode: 'BUS 102', mode: 'exam', text: 'What is a stakeholder?', options: ['Anyone affected by business', 'Only shareholders', 'Only employees', 'Only customers'], correctOption: 0, explanation: 'Anyone with interest in business.' },
    { courseCode: 'BUS 102', mode: 'exam', text: 'What is SWOT analysis?', options: ['Strengths, Weaknesses, Opportunities, Threats', 'Financial ratio', 'Marketing plan', 'Production schedule'], correctOption: 0, explanation: 'Strategic planning tool.' },
    { courseCode: 'BUS 102', mode: 'exam', text: 'What is CSR?', options: ['Corporate Social Responsibility', 'Customer Service', 'Company Sales', 'Cost Saving'], correctOption: 0, explanation: 'Business responsibility to society.' },

    { courseCode: 'ACC 101', mode: 'exam', text: 'What is accounting equation?', options: ['Assets = Liabilities + Equity', 'Revenue = Expenses', 'Cash = Profit', 'Debit = Credit'], correctOption: 0, explanation: 'Fundamental equation: A = L + E.' },
    { courseCode: 'ACC 101', mode: 'exam', text: 'What is a debit?', options: ['Left side entry', 'Right side entry', 'Increase liability', 'Decrease asset'], correctOption: 0, explanation: 'Entry on left side of T-account.' },
    { courseCode: 'ACC 101', mode: 'exam', text: 'What is double-entry?', options: ['Two accounts per transaction', 'Single entry', 'Cash only', 'Credit only'], correctOption: 0, explanation: 'Every transaction affects two accounts.' },
    { courseCode: 'ACC 101', mode: 'exam', text: 'What is a balance sheet?', options: ['Financial position statement', 'Transaction record', 'Income statement', 'Cash flow'], correctOption: 0, explanation: 'Shows assets, liabilities, equity.' },

    { courseCode: 'ACC 102', mode: 'exam', text: 'What is trial balance?', options: ['List of account balances', 'Income statement', 'Balance sheet', 'Cash flow'], correctOption: 0, explanation: 'Lists all accounts to check equality.' },
    { courseCode: 'ACC 102', mode: 'exam', text: 'What is depreciation?', options: ['Asset cost allocation', 'Value increase', 'Cash outflow', 'Revenue'], correctOption: 0, explanation: 'Spreading cost over useful life.' },
    { courseCode: 'ACC 102', mode: 'exam', text: 'What is income statement?', options: ['Revenue and expenses', 'Assets', 'Liabilities', 'Equity'], correctOption: 0, explanation: 'Shows profit over period.' },
    { courseCode: 'ACC 102', mode: 'exam', text: 'What is accrual accounting?', options: ['Record when occur', 'Cash basis', 'Single entry', 'Inventory'], correctOption: 0, explanation: 'Record when earned/incurred.' },

    // ==================== ENVIRONMENTAL DESIGN ====================
    { courseCode: 'ARC 101', mode: 'exam', text: 'What is architecture?', options: ['Design of buildings', 'Construction only', 'Drawing only', 'Interior only'], correctOption: 0, explanation: 'Art and science of building design.' },
    { courseCode: 'ARC 101', mode: 'exam', text: 'What is a floor plan?', options: ['Top-down layout', 'Side view', '3D rendering', 'Electrical diagram'], correctOption: 0, explanation: 'Scaled diagram from above.' },
    { courseCode: 'ARC 101', mode: 'exam', text: 'What does CAD stand for?', options: ['Computer-Aided Design', 'Construction And Development', 'Creative Art Design', 'Civil Architecture'], correctOption: 0, explanation: 'CAD = Computer-Aided Design.' },
    { courseCode: 'ARC 101', mode: 'exam', text: 'What is sustainable architecture?', options: ['Eco-friendly design', 'Only wood', 'No plans', 'Cheap construction'], correctOption: 0, explanation: 'Minimizing environmental impact.' },

    { courseCode: 'ARC 102', mode: 'exam', text: 'What is a foundation?', options: ['Lowest load-bearing part', 'Roof', 'Wall covering', 'Floor'], correctOption: 0, explanation: 'Transfers loads to ground.' },
    { courseCode: 'ARC 102', mode: 'exam', text: 'What is a load-bearing wall?', options: ['Supports weight', 'Decorative', 'Partition', 'Curtain'], correctOption: 0, explanation: 'Carries structural weight.' },
    { courseCode: 'ARC 102', mode: 'exam', text: 'What is reinforced concrete?', options: ['Concrete with steel', 'Plain concrete', 'Wood', 'Brick'], correctOption: 0, explanation: 'Combines compressive and tensile strength.' },
    { courseCode: 'ARC 102', mode: 'exam', text: 'What is formwork?', options: ['Temporary mold', 'Permanent structure', 'Scaffolding', 'Roofing'], correctOption: 0, explanation: 'Mold for pouring concrete.' },

    { courseCode: 'URP 101', mode: 'exam', text: 'What is urban planning?', options: ['City development design', 'Building only', 'Roads only', 'Parks only'], correctOption: 0, explanation: 'Managing land use and infrastructure.' },
    { courseCode: 'URP 101', mode: 'exam', text: 'What is zoning?', options: ['Dividing land by use', 'Tax collection', 'Road building', 'Water supply'], correctOption: 0, explanation: 'Regulating land use types.' },
    { courseCode: 'URP 101', mode: 'exam', text: 'What is a master plan?', options: ['Long-term development plan', 'Blueprint', 'Budget', 'Traffic study'], correctOption: 0, explanation: 'Guides long-term growth.' },
    { courseCode: 'URP 101', mode: 'exam', text: 'What is sustainable development?', options: ['Present needs without compromising future', 'Unlimited growth', 'Industrial only', 'Commercial only'], correctOption: 0, explanation: 'Balancing needs for future.' },

    { courseCode: 'URP 102', mode: 'exam', text: 'What is regional planning?', options: ['Planning across region', 'City only', 'Building design', 'Road construction'], correctOption: 0, explanation: 'Coordinating development across areas.' },
    { courseCode: 'URP 102', mode: 'exam', text: 'What is rural-urban migration?', options: ['Countryside to city', 'City to countryside', 'International', 'Seasonal'], correctOption: 0, explanation: 'Movement from rural to urban areas.' },
    { courseCode: 'URP 102', mode: 'exam', text: 'What is a growth pole?', options: ['Economic development center', 'Farming area', 'Residential area', 'Park'], correctOption: 0, explanation: 'Stimulates surrounding development.' },
    { courseCode: 'URP 102', mode: 'exam', text: 'What is regional disparity?', options: ['Uneven development', 'Equal development', 'Urban growth', 'Population increase'], correctOption: 0, explanation: 'Inequalities between regions.' },

    { courseCode: 'QSV 101', mode: 'exam', text: 'What is quantity surveying?', options: ['Managing construction costs', 'Building design', 'Structural engineering', 'Architecture'], correctOption: 0, explanation: 'Cost estimation and contract management.' },
    { courseCode: 'QSV 101', mode: 'exam', text: 'What is bill of quantities?', options: ['Materials and labor list', 'Architectural drawing', 'Building permit', 'Contract'], correctOption: 0, explanation: 'Itemized materials and costs.' },
    { courseCode: 'QSV 101', mode: 'exam', text: 'What is cost estimation?', options: ['Predicting project costs', 'Actual spending', 'Profit calculation', 'Tax assessment'], correctOption: 0, explanation: 'Forecasting total expenditure.' },
    { courseCode: 'QSV 101', mode: 'exam', text: 'What is a tender document?', options: ['Bid invitation', 'Building plan', 'Payment receipt', 'Insurance'], correctOption: 0, explanation: 'Invites contractors to bid.' },

    { courseCode: 'QSV 102', mode: 'exam', text: 'What is a foundation?', options: ['Lowest building part', 'Roof', 'Wall', 'Floor'], correctOption: 0, explanation: 'Transfers loads to ground.' },
    { courseCode: 'QSV 102', mode: 'exam', text: 'What is reinforced concrete?', options: ['Concrete with steel', 'Plain concrete', 'Wood', 'Brick'], correctOption: 0, explanation: 'Combines strength of both.' },
    { courseCode: 'QSV 102', mode: 'exam', text: 'What is formwork?', options: ['Temporary mold', 'Permanent', 'Scaffolding', 'Roofing'], correctOption: 0, explanation: 'Mold for pouring concrete.' },
    { courseCode: 'QSV 102', mode: 'exam', text: 'What is a load-bearing wall?', options: ['Supports weight', 'Decorative', 'Partition', 'Curtain'], correctOption: 0, explanation: 'Carries structural loads.' },

    // ==================== BASIC MEDICAL SCIENCES ====================
    { courseCode: 'ANA 101', mode: 'exam', text: 'How many bones in adult body?', options: ['106', '206', '306', '156'], correctOption: 1, explanation: 'Adult human has 206 bones.' },
    { courseCode: 'ANA 101', mode: 'exam', text: 'Largest organ?', options: ['Heart', 'Liver', 'Skin', 'Brain'], correctOption: 2, explanation: 'Skin covers ~20 sq ft.' },
    { courseCode: 'ANA 101', mode: 'exam', text: 'What does heart pump?', options: ['Air', 'Blood', 'Water', 'Lymph'], correctOption: 1, explanation: 'Heart pumps blood.' },
    { courseCode: 'ANA 101', mode: 'exam', text: 'Which bone protects brain?', options: ['Ribcage', 'Skull', 'Spine', 'Pelvis'], correctOption: 1, explanation: 'Skull protects brain.' },

    { courseCode: 'ANA 102', mode: 'exam', text: 'What is the femur?', options: ['Thigh bone', 'Arm bone', 'Skull bone', 'Spine bone'], correctOption: 0, explanation: 'Longest bone in body.' },
    { courseCode: 'ANA 102', mode: 'exam', text: 'What are ligaments?', options: ['Connect bone to bone', 'Connect muscle to bone', 'Blood vessels', 'Nerves'], correctOption: 0, explanation: 'Ligaments connect bones.' },
    { courseCode: 'ANA 102', mode: 'exam', text: 'What is the cerebrum?', options: ['Largest brain part', 'Spinal cord', 'Heart chamber', 'Lung lobe'], correctOption: 0, explanation: 'Controls thinking and movement.' },
    { courseCode: 'ANA 102', mode: 'exam', text: 'How many chambers in heart?', options: ['2', '3', '4', '6'], correctOption: 2, explanation: 'Heart has 4 chambers.' },

    { courseCode: 'PHS 101', mode: 'exam', text: 'What is physiology?', options: ['Study of body function', 'Body structure', 'Diseases', 'Drugs'], correctOption: 0, explanation: 'How living organisms function.' },
    { courseCode: 'PHS 101', mode: 'exam', text: 'What is homeostasis?', options: ['Stable internal environment', 'Cell division', 'Muscle contraction', 'Nerve impulse'], correctOption: 0, explanation: 'Maintaining internal stability.' },
    { courseCode: 'PHS 101', mode: 'exam', text: 'Hemoglobin function?', options: ['Transport oxygen', 'Fight infection', 'Clot blood', 'Digest food'], correctOption: 0, explanation: 'Carries oxygen in blood.' },
    { courseCode: 'PHS 101', mode: 'exam', text: 'What is a neuron?', options: ['Nerve cell', 'Blood cell', 'Bone cell', 'Muscle cell'], correctOption: 0, explanation: 'Transmits electrical signals.' },

    { courseCode: 'PHS 102', mode: 'exam', text: 'Cardiovascular system?', options: ['Heart and vessels', 'Lungs only', 'Brain only', 'Muscles'], correctOption: 0, explanation: 'Heart and blood vessels.' },
    { courseCode: 'PHS 102', mode: 'exam', text: 'What is respiration?', options: ['Gas exchange', 'Heartbeat', 'Movement', 'Digestion'], correctOption: 0, explanation: 'O₂ in, CO₂ out.' },
    { courseCode: 'PHS 102', mode: 'exam', text: 'Kidney function?', options: ['Filter blood', 'Pump blood', 'Digest food', 'Breathe'], correctOption: 0, explanation: 'Filters waste, produces urine.' },
    { courseCode: 'PHS 102', mode: 'exam', text: 'Endocrine system?', options: ['Hormone glands', 'Nervous system', 'Digestive', 'Skeletal'], correctOption: 0, explanation: 'Produces hormones.' },

    { courseCode: 'BCH 101', mode: 'exam', text: 'What is biochemistry?', options: ['Chemical processes in life', 'Rock study', 'Weather study', 'Star study'], correctOption: 0, explanation: 'Chemistry of living organisms.' },
    { courseCode: 'BCH 101', mode: 'exam', text: 'What are enzymes?', options: ['Biological catalysts', 'Structural proteins', 'Hormones', 'Antibodies'], correctOption: 0, explanation: 'Speed up biochemical reactions.' },
    { courseCode: 'BCH 101', mode: 'exam', text: 'What are carbohydrates?', options: ['C, H, O compounds', 'Proteins', 'Fats', 'Vitamins'], correctOption: 0, explanation: 'Primary energy source.' },
    { courseCode: 'BCH 101', mode: 'exam', text: 'What is DNA?', options: ['Genetic material', 'Protein', 'Lipid', 'Carbohydrate'], correctOption: 0, explanation: 'Carries genetic information.' },

    { courseCode: 'BCH 102', mode: 'exam', text: 'What is metabolism?', options: ['All chemical reactions', 'Only digestion', 'Only breathing', 'Only growth'], correctOption: 0, explanation: 'Sum of all biochemical processes.' },
    { courseCode: 'BCH 102', mode: 'exam', text: 'What is glycolysis?', options: ['Glucose breakdown', 'Protein synthesis', 'Fat storage', 'DNA replication'], correctOption: 0, explanation: 'Converts glucose to pyruvate.' },
    { courseCode: 'BCH 102', mode: 'exam', text: 'What is ATP?', options: ['Energy currency', 'Protein', 'Lipid', 'Carbohydrate'], correctOption: 0, explanation: 'Adenosine triphosphate.' },
    { courseCode: 'BCH 102', mode: 'exam', text: 'What is Krebs cycle?', options: ['Energy production cycle', 'Photosynthesis', 'Protein synthesis', 'DNA repair'], correctOption: 0, explanation: 'Generates ATP in mitochondria.' },

    // ==================== CLINICAL SCIENCES ====================
    { courseCode: 'MED 101', mode: 'exam', text: 'What is Hippocratic Oath?', options: ['Ethical code for physicians', 'Medical textbook', 'Surgery procedure', 'Hospital policy'], correctOption: 0, explanation: 'Historic physician ethics code.' },
    { courseCode: 'MED 101', mode: 'exam', text: 'What are vital signs?', options: ['Temperature, pulse, respiration, BP', 'Only temperature', 'Only pulse', 'X-ray results'], correctOption: 0, explanation: 'Four primary vital signs.' },
    { courseCode: 'MED 101', mode: 'exam', text: 'What is diagnosis?', options: ['Identifying disease', 'Treatment plan', 'Surgery', 'Medication'], correctOption: 0, explanation: 'Determining disease from symptoms.' },
    { courseCode: 'MED 101', mode: 'exam', text: 'What does CPR stand for?', options: ['Cardiopulmonary Resuscitation', 'Clinical Patient Record', 'Cardiac Pressure Relief', 'Complete Recovery'], correctOption: 0, explanation: 'Emergency life-saving procedure.' },

    { courseCode: 'MED 102', mode: 'exam', text: 'What is patient history?', options: ['Medical background', 'Financial record', 'School record', 'Travel history'], correctOption: 0, explanation: 'Past medical information.' },
    { courseCode: 'MED 102', mode: 'exam', text: 'What is physical examination?', options: ['Hands-on assessment', 'Lab test only', 'X-ray only', 'Interview only'], correctOption: 0, explanation: 'Direct examination of patient.' },
    { courseCode: 'MED 102', mode: 'exam', text: 'What is prognosis?', options: ['Predicted outcome', 'Diagnosis', 'Treatment', 'Prevention'], correctOption: 0, explanation: 'Likely course of disease.' },
    { courseCode: 'MED 102', mode: 'exam', text: 'What is differential diagnosis?', options: ['List of possible conditions', 'Single diagnosis', 'Treatment plan', 'Lab result'], correctOption: 0, explanation: 'Multiple possible diagnoses.' },

    { courseCode: 'SUR 101', mode: 'exam', text: 'What is aseptic technique?', options: ['Preventing contamination', 'Anesthesia', 'Suturing', 'Positioning'], correctOption: 0, explanation: 'Sterile technique in surgery.' },
    { courseCode: 'SUR 101', mode: 'exam', text: 'What is anesthesia?', options: ['Loss of sensation', 'Infection control', 'Wound healing', 'Bone setting'], correctOption: 0, explanation: 'Blocks pain during procedures.' },
    { courseCode: 'SUR 101', mode: 'exam', text: 'What is surgical incision?', options: ['Cut into tissue', 'Bandage', 'Medication', 'Physical therapy'], correctOption: 0, explanation: 'Controlled cut for access.' },
    { courseCode: 'SUR 101', mode: 'exam', text: 'What is wound healing?', options: ['Tissue repair', 'Infection', 'Bleeding', 'Swelling'], correctOption: 0, explanation: 'Body repairs damaged tissue.' },

    { courseCode: 'SUR 102', mode: 'exam', text: 'What is suturing?', options: ['Closing wounds with stitches', 'Anesthesia', 'Incisions', 'Bandages'], correctOption: 0, explanation: 'Stitching wounds closed.' },
    { courseCode: 'SUR 102', mode: 'exam', text: 'What is laparoscopy?', options: ['Minimally invasive surgery', 'Open heart', 'Brain surgery', 'Bone surgery'], correctOption: 0, explanation: 'Small incision surgery.' },
    { courseCode: 'SUR 102', mode: 'exam', text: 'What is hemostasis?', options: ['Stopping bleeding', 'Starting anesthesia', 'Closing wounds', 'Removing organs'], correctOption: 0, explanation: 'Controlling blood loss.' },
    { courseCode: 'SUR 102', mode: 'exam', text: 'What is surgical drainage?', options: ['Removing fluids', 'Adding fluid', 'Measuring BP', 'Taking X-rays'], correctOption: 0, explanation: 'Removing excess fluids.' },

    { courseCode: 'OBS 101', mode: 'exam', text: 'What is obstetrics?', options: ['Pregnancy and childbirth care', 'Heart surgery', 'Bone treatment', 'Eye care'], correctOption: 0, explanation: 'Care during pregnancy and birth.' },
    { courseCode: 'OBS 101', mode: 'exam', text: 'What is gestation?', options: ['Fetal development period', 'Birth process', 'Breastfeeding', 'Infant care'], correctOption: 0, explanation: '~40 weeks in humans.' },
    { courseCode: 'OBS 101', mode: 'exam', text: 'What is prenatal care?', options: ['Healthcare during pregnancy', 'Post-birth care', 'Infant vaccination', 'Surgery'], correctOption: 0, explanation: 'Monitoring mother and fetus.' },
    { courseCode: 'OBS 101', mode: 'exam', text: 'What is placenta?', options: ['Organ connecting fetus to uterus', 'Baby\'s heart', 'Amniotic fluid', 'Umbilical cord'], correctOption: 0, explanation: 'Provides oxygen and nutrients.' },

    { courseCode: 'OBS 102', mode: 'exam', text: 'What is gynecology?', options: ['Female reproductive health', 'Pregnancy care', 'Child care', 'Male health'], correctOption: 0, explanation: 'Female reproductive system.' },
    { courseCode: 'OBS 102', mode: 'exam', text: 'What is menopause?', options: ['End of menstruation', 'Start of puberty', 'Pregnancy', 'Childhood'], correctOption: 0, explanation: 'Around age 45-55.' },
    { courseCode: 'OBS 102', mode: 'exam', text: 'What is Pap smear?', options: ['Cervical cancer screening', 'Pregnancy test', 'Blood test', 'Urine test'], correctOption: 0, explanation: 'Detects abnormal cervical cells.' },
    { courseCode: 'OBS 102', mode: 'exam', text: 'What is endometriosis?', options: ['Tissue outside uterus', 'Ovarian cyst', 'Fibroid', 'Cancer'], correctOption: 0, explanation: 'Endometrial-like tissue outside.' },

    // ==================== DENTISTRY ====================
    { courseCode: 'DEN 101', mode: 'exam', text: 'How many permanent teeth?', options: ['20', '28', '32', '36'], correctOption: 2, explanation: '32 permanent teeth.' },
    { courseCode: 'DEN 101', mode: 'exam', text: 'Hardest body substance?', options: ['Bone', 'Enamel', 'Dentin', 'Cartilage'], correctOption: 1, explanation: 'Tooth enamel is hardest.' },
    { courseCode: 'DEN 101', mode: 'exam', text: 'What is dental caries?', options: ['Tooth decay', 'Gum disease', 'Jaw pain', 'Whitening'], correctOption: 0, explanation: 'Cavities from acid.' },
    { courseCode: 'DEN 101', mode: 'exam', text: 'How many tooth types?', options: ['2', '3', '4', '5'], correctOption: 2, explanation: 'Incisors, canines, premolars, molars.' },

    { courseCode: 'DEN 102', mode: 'exam', text: 'What is pulp?', options: ['Tooth center with nerves', 'Enamel', 'Gum', 'Root'], correctOption: 0, explanation: 'Inner part with nerves.' },
    { courseCode: 'DEN 102', mode: 'exam', text: 'What is dentin?', options: ['Layer under enamel', 'Outer layer', 'Gum tissue', 'Bone'], correctOption: 0, explanation: 'Hard tissue beneath enamel.' },
    { courseCode: 'DEN 102', mode: 'exam', text: 'What is cementum?', options: ['Covers tooth root', 'Enamel', 'Pulp', 'Crown'], correctOption: 0, explanation: 'Anchors tooth in socket.' },
    { courseCode: 'DEN 102', mode: 'exam', text: 'What is periodontium?', options: ['Supporting structures', 'Tooth only', 'Enamel only', 'Pulp only'], correctOption: 0, explanation: 'Gums and bone support.' },

    { courseCode: 'ORA 101', mode: 'exam', text: 'What causes dental caries?', options: ['Bacteria producing acid', 'Drinking water', 'Eating vegetables', 'Brushing'], correctOption: 0, explanation: 'Bacteria ferment sugars to acid.' },
    { courseCode: 'ORA 101', mode: 'exam', text: 'What is plaque?', options: ['Bacterial film on teeth', 'Tooth enamel', 'Fluoride', 'Filling'], correctOption: 0, explanation: 'Sticky biofilm.' },
    { courseCode: 'ORA 101', mode: 'exam', text: 'How often to brush?', options: ['Twice daily', 'Once a week', 'Once a month', 'Once a year'], correctOption: 0, explanation: 'Brush twice daily.' },
    { courseCode: 'ORA 101', mode: 'exam', text: 'What is fluoride?', options: ['Enamel-strengthening mineral', 'Sugar', 'Bacteria', 'Acid'], correctOption: 0, explanation: 'Remineralizes enamel.' },

    { courseCode: 'ORA 102', mode: 'exam', text: 'What is prophylaxis?', options: ['Professional cleaning', 'Extraction', 'Root canal', 'Filling'], correctOption: 0, explanation: 'Professional teeth cleaning.' },
    { courseCode: 'ORA 102', mode: 'exam', text: 'What are sealants?', options: ['Protective coating', 'Filling', 'Whitening', 'Anesthetic'], correctOption: 0, explanation: 'Plastic coating on teeth.' },
    { courseCode: 'ORA 102', mode: 'exam', text: 'What is gingivitis?', options: ['Gum inflammation', 'Tooth decay', 'Jaw pain', 'Mouth cancer'], correctOption: 0, explanation: 'Early gum disease.' },
    { courseCode: 'ORA 102', mode: 'exam', text: 'How often dental checkup?', options: ['Every 6 months', 'Every 5 years', 'Once in lifetime', 'Only when in pain'], correctOption: 0, explanation: 'Twice yearly recommended.' },

    // ==================== COMPUTING ====================
    { courseCode: 'COS 101', mode: 'exam', text: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'], correctOption: 0, explanation: 'Brain of the computer.' },
    { courseCode: 'COS 101', mode: 'exam', text: 'Which is input device?', options: ['Monitor', 'Keyboard', 'Printer', 'Speaker'], correctOption: 1, explanation: 'Keyboard enters data.' },
    { courseCode: 'COS 101', mode: 'exam', text: 'What is RAM?', options: ['Random Access Memory', 'Read-Only Memory', 'Remote Access Module', 'Rapid Application'], correctOption: 0, explanation: 'Temporary data storage.' },
    { courseCode: 'COS 101', mode: 'exam', text: 'What does bit stand for?', options: ['Binary digit', 'Byte integer', 'Basic information', 'Built-in test'], correctOption: 0, explanation: 'Smallest data unit, 0 or 1.' },

    { courseCode: 'COS 102', mode: 'exam', text: 'What is an algorithm?', options: ['Step-by-step procedure', 'Programming language', 'Hardware', 'OS'], correctOption: 0, explanation: 'Instructions to solve problem.' },
    { courseCode: 'COS 102', mode: 'exam', text: 'What is a variable?', options: ['Named storage location', 'Constant', 'Loop', 'Function'], correctOption: 0, explanation: 'Holds data that can change.' },
    { courseCode: 'COS 102', mode: 'exam', text: 'What is a loop?', options: ['Repeating code', 'Single execution', 'Error handler', 'Data type'], correctOption: 0, explanation: 'Repeats until condition met.' },
    { courseCode: 'COS 102', mode: 'exam', text: 'What is a function?', options: ['Reusable code block', 'Variable', 'Data type', 'File name'], correctOption: 0, explanation: 'Performs specific task.' },

    { courseCode: 'STA 111', mode: 'exam', text: 'What is statistics?', options: ['Collecting and analyzing data', 'Study of animals', 'Study of plants', 'Study of languages'], correctOption: 0, explanation: 'Science of data.' },
    { courseCode: 'STA 111', mode: 'exam', text: 'Mean of 2,4,6,8,10?', options: ['4', '5', '6', '7'], correctOption: 2, explanation: '30/5 = 6.' },
    { courseCode: 'STA 111', mode: 'exam', text: 'Median of 1,3,5,7,9?', options: ['3', '5', '7', '1'], correctOption: 1, explanation: 'Middle value is 5.' },
    { courseCode: 'STA 111', mode: 'exam', text: 'Mode of 2,3,3,4,5?', options: ['2', '3', '4', '5'], correctOption: 1, explanation: '3 appears most.' },

    { courseCode: 'STA 112', mode: 'exam', text: 'What is probability?', options: ['Likelihood measure', 'Sum of data', 'Average', 'Maximum'], correctOption: 0, explanation: '0 to 1 chance.' },
    { courseCode: 'STA 112', mode: 'exam', text: 'What is standard deviation?', options: ['Data spread measure', 'Mean', 'Median', 'Mode'], correctOption: 0, explanation: 'How spread out data is.' },
    { courseCode: 'STA 112', mode: 'exam', text: 'What is a histogram?', options: ['Data distribution graph', 'Number table', 'Single number', 'Equation'], correctOption: 0, explanation: 'Bar chart of frequencies.' },
    { courseCode: 'STA 112', mode: 'exam', text: 'What is correlation?', options: ['Variable relationship', 'Single variable', 'Data collection', 'Data entry'], correctOption: 0, explanation: 'How variables relate.' },

    { courseCode: 'STA 121', mode: 'exam', text: 'What is sampling?', options: ['Selecting subset', 'Counting all', 'Ignoring data', 'Random guessing'], correctOption: 0, explanation: 'Subset from population.' },
    { courseCode: 'STA 121', mode: 'exam', text: 'What is regression?', options: ['Variable relationship model', 'Data sorting', 'Data deletion', 'Data entry'], correctOption: 0, explanation: 'Models relationships.' },
    { courseCode: 'STA 121', mode: 'exam', text: 'What is confidence interval?', options: ['Range for parameter', 'Single number', 'Exact value', 'Minimum'], correctOption: 0, explanation: 'Likely parameter range.' },
    { courseCode: 'STA 121', mode: 'exam', text: 'What is hypothesis testing?', options: ['Testing claims', 'Data collection', 'Data cleaning', 'Data storage'], correctOption: 0, explanation: 'Evaluating population claims.' },

    // ==================== GST ====================
    { courseCode: 'GST 111', mode: 'exam', text: 'Which is NOT a part of speech?', options: ['Noun', 'Verb', 'Paragraph', 'Adjective'], correctOption: 2, explanation: 'Paragraph is a writing unit.' },
    { courseCode: 'GST 111', mode: 'exam', text: 'Correct sentence?', options: ['She go school', 'She goes to school', 'She going school', 'She gone school'], correctOption: 1, explanation: 'Third person: goes.' },
    { courseCode: 'GST 111', mode: 'exam', text: 'Synonym of happy?', options: ['Sad', 'Joyful', 'Angry', 'Tired'], correctOption: 1, explanation: 'Joyful = happy.' },
    { courseCode: 'GST 111', mode: 'exam', text: 'Plural of child?', options: ['Childs', 'Children', 'Childrens', 'Childes'], correctOption: 1, explanation: 'Irregular plural.' },

    { courseCode: 'GST 112', mode: 'exam', text: 'What is a paragraph?', options: ['Group of related sentences', 'Single word', 'A letter', 'Punctuation'], correctOption: 0, explanation: 'Develops one main idea.' },
    { courseCode: 'GST 112', mode: 'exam', text: 'What is a topic sentence?', options: ['States main idea', 'Last sentence', 'Random sentence', 'Closing sentence'], correctOption: 0, explanation: 'Main idea of paragraph.' },
    { courseCode: 'GST 112', mode: 'exam', text: 'What is a composition?', options: ['Intro, body, conclusion', 'Single sentence', 'A word', 'A letter'], correctOption: 0, explanation: 'Structured written work.' },
    { courseCode: 'GST 112', mode: 'exam', text: 'What is a summary?', options: ['Brief main points', 'Full text', 'Detailed explanation', 'Word list'], correctOption: 0, explanation: 'Condensed version.' },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Clear existing questions
        await Question.deleteMany({});
        console.log('✅ Cleared old questions\n');

        let count = 0;
        for (const q of allQuestions) {
            await Question.create(q);
            count++;
            console.log(`✅ [${q.courseCode}] ${q.text.substring(0, 50)}...`);
        }

        console.log(`\n🎉 ${count} questions seeded successfully!`);
        console.log(`📚 ${new Set(allQuestions.map(q => q.courseCode)).size} courses covered`);
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
}
seed();
