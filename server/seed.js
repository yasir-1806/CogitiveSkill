require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Topic = require('./models/Topic');
const Level = require('./models/Level');
const Question = require('./models/Question');
const Slot = require('./models/Slot');
const Leaderboard = require('./models/Leaderboard');
const Booking = require('./models/Booking');

const topics = [
  { topicName: 'Memory', description: 'Test your short-term and working memory capacity', icon: '🧠', color: '#6366f1', gradient: 'from-indigo-500 to-purple-600' },
  { topicName: 'Logical Reasoning', description: 'Evaluate your pattern recognition and logical deduction', icon: '🔍', color: '#06b6d4', gradient: 'from-cyan-500 to-blue-600' },
  { topicName: 'Attention', description: 'Measure your focus and concentration levels', icon: '🎯', color: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
  { topicName: 'Pattern Recognition', description: 'Identify complex visual and numerical patterns', icon: '🔮', color: '#8b5cf6', gradient: 'from-violet-500 to-purple-600' },
  { topicName: 'Problem Solving', description: 'Tackle algorithmic challenges and find solutions', icon: '⚡', color: '#f59e0b', gradient: 'from-amber-500 to-orange-600' },
  { topicName: 'Verbal Ability', description: 'Test vocabulary, comprehension and language skills', icon: '📚', color: '#f43f5e', gradient: 'from-rose-500 to-pink-600' },
  { topicName: 'Reaction Time', description: 'Measure the speed of your cognitive responses', icon: '⏱️', color: '#0ea5e9', gradient: 'from-sky-500 to-cyan-600' },
];

const difficultyMap = ['easy', 'medium', 'hard'];

const sampleQuestions = {
  Memory: [
    { questionText: 'What comes after the sequence: 7, 14, 21, 28, ___?', options: ['31', '35', '36', '42'], correctAnswer: 1 },
    { questionText: 'A list shows: Apple, Banana, Cherry, Date. Which fruit was third?', options: ['Apple', 'Banana', 'Cherry', 'Date'], correctAnswer: 2 },
    { questionText: 'Remember: Red=1, Blue=2, Green=3. What number is Blue?', options: ['1', '2', '3', '4'], correctAnswer: 1 },
    { questionText: 'If ABCDE maps to 12345, what does "CAB" spell numerically?', options: ['312', '213', '321', '123'], correctAnswer: 2 },
    { questionText: 'A code was shown: 8472. Which digit was first?', options: ['4', '7', '8', '2'], correctAnswer: 2 },
  ],
  'Logical Reasoning': [
    { questionText: 'All cats are mammals. Some mammals are dogs. Which is definitely true?', options: ['All dogs are cats', 'Some cats are dogs', 'All cats are mammals', 'Some mammals are cats'], correctAnswer: 2 },
    { questionText: 'If A > B and B > C, then:', options: ['C > A', 'A > C', 'B > A', 'C = A'], correctAnswer: 1 },
    { questionText: 'Complete the analogy: Book is to Reading as Fork is to ___', options: ['Kitchen', 'Eating', 'Cooking', 'Food'], correctAnswer: 1 },
    { questionText: 'What is the next term: 2, 4, 8, 16, ___?', options: ['24', '30', '32', '36'], correctAnswer: 2 },
    { questionText: 'If Monday is Day 1, what day is Day 5?', options: ['Thursday', 'Friday', 'Wednesday', 'Saturday'], correctAnswer: 1 },
  ],
  Attention: [
    { questionText: 'Count the letter "e" in: "Excellence requires persistent effort"', options: ['4', '5', '6', '7'], correctAnswer: 2 },
    { questionText: 'Which number is NOT a prime: 2, 3, 9, 11?', options: ['2', '3', '9', '11'], correctAnswer: 2 },
    { questionText: 'Spot the odd one: 14, 21, 28, 33, 42', options: ['14', '21', '33', '42'], correctAnswer: 2 },
    { questionText: 'Find the difference: ABCDE vs ABCBE — which position differs?', options: ['Position 2', 'Position 3', 'Position 4', 'Position 5'], correctAnswer: 2 },
    { questionText: 'How many triangles are in this count: △ ▽ △ △ ▽ △ ▽', options: ['3', '4', '5', '6'], correctAnswer: 1 },
  ],
  'Pattern Recognition': [
    { questionText: 'What is next: 1, 1, 2, 3, 5, 8, ___?', options: ['11', '12', '13', '14'], correctAnswer: 2 },
    { questionText: 'Complete the pattern: ○□△○□ ___', options: ['○', '□', '△', '◇'], correctAnswer: 2 },
    { questionText: 'What comes next: Z, Y, X, W, ___?', options: ['U', 'V', 'T', 'S'], correctAnswer: 1 },
    { questionText: '2, 6, 12, 20, 30, ___?', options: ['40', '42', '44', '45'], correctAnswer: 1 },
    { questionText: 'Find the rule: 3, 9, 27, 81, ___?', options: ['162', '243', '324', '405'], correctAnswer: 1 },
  ],
  'Problem Solving': [
    { questionText: 'A train travels 60 km in 1 hour. How far in 2.5 hours?', options: ['120 km', '140 km', '150 km', '160 km'], correctAnswer: 2 },
    { questionText: 'If 5 machines make 5 items in 5 minutes, how long for 100 machines to make 100 items?', options: ['1 min', '5 min', '100 min', '500 min'], correctAnswer: 1 },
    { questionText: '3 workers finish a job in 6 days. How many days for 6 workers?', options: ['2 days', '3 days', '4 days', '6 days'], correctAnswer: 1 },
    { questionText: 'What is 15% of 200?', options: ['25', '30', '35', '40'], correctAnswer: 1 },
    { questionText: 'If x + 5 = 12, what is 2x?', options: ['10', '12', '14', '18'], correctAnswer: 2 },
  ],
  'Verbal Ability': [
    { questionText: 'What is a synonym for "Eloquent"?', options: ['Silent', 'Articulate', 'Confused', 'Dull'], correctAnswer: 1 },
    { questionText: 'Choose the correct spelling:', options: ['Occurance', 'Occurence', 'Occurrence', 'Occurrance'], correctAnswer: 2 },
    { questionText: 'Antonym of "Benevolent"?', options: ['Kind', 'Generous', 'Malevolent', 'Peaceful'], correctAnswer: 2 },
    { questionText: '"She ran _____ the park." Choose correct preposition:', options: ['in', 'through', 'by', 'of'], correctAnswer: 1 },
    { questionText: 'What does "Ephemeral" mean?', options: ['Long-lasting', 'Short-lived', 'Ancient', 'Holy'], correctAnswer: 1 },
  ],
  'Reaction Time': [
    { questionText: 'Average human reaction time is approximately:', options: ['50ms', '100ms', '250ms', '500ms'], correctAnswer: 2 },
    { questionText: 'Which sense has the fastest reaction time?', options: ['Sight', 'Sound', 'Touch', 'Smell'], correctAnswer: 1 },
    { questionText: 'A car at 60 mph travels how far in 1 second of reaction delay?', options: ['15m', '22m', '27m', '30m'], correctAnswer: 2 },
    { questionText: 'Quick! 3 + 7 × 2 = ?', options: ['20', '17', '14', '27'], correctAnswer: 1 },
    { questionText: 'Which is faster: nerve signal or sound?', options: ['Sound', 'Nerve signal', 'They are equal', 'Depends on distance'], correctAnswer: 1 },
  ],
};

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Topic.deleteMany({}), Level.deleteMany({}),
      Question.deleteMany({}), Slot.deleteMany({}), Leaderboard.deleteMany({}),
      Booking.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create admin
    const admin = await User.create({ name: 'Admin User', email: 'admin@cogniq.com', password: 'admin123', role: 'admin' });
    console.log('✅ Admin created: admin@cogniq.com / admin123');

    // Create student
    const student = await User.create({ name: 'John Doe', email: 'student@cogniq.com', password: 'student123', role: 'student' });
    await Leaderboard.create({ studentId: student._id });
    console.log('✅ Student created: student@cogniq.com / student123');

    // Create topics
    const createdTopics = await Topic.insertMany(topics);
    console.log(`✅ ${createdTopics.length} topics created`);

    // Create levels and questions
    for (const topic of createdTopics) {
      const levels = [];
      for (let lvl = 1; lvl <= 3; lvl++) {
        const level = await Level.create({
          topicId: topic._id,
          levelNumber: lvl,
          difficulty: difficultyMap[lvl - 1],
          title: `Level ${lvl} – ${difficultyMap[lvl - 1].charAt(0).toUpperCase() + difficultyMap[lvl - 1].slice(1)}`,
          description: `${difficultyMap[lvl - 1].charAt(0).toUpperCase() + difficultyMap[lvl - 1].slice(1)} difficulty assessment`,
          timeLimit: 3600, // Fixed 1 hour (3600 seconds)
          passingScore: 60,
        });
        levels.push(level);

        const qs = sampleQuestions[topic.topicName] || sampleQuestions['Memory'];
        // Generate 40 questions by repeating and slightly varying the base templates
        for (let qi = 0; qi < 40; qi++) {
          const template = qs[qi % qs.length];
          // Slight variation in question text to make them uniquely identifiable (e.g. Question 1, Question 6...)
          const questionText = `${template.questionText} (Variant ${Math.floor(qi / qs.length) + 1})`;
          
          await Question.create({
            levelId: level._id, topicId: topic._id,
            questionText: questionText,
            options: template.options,
            correctAnswer: template.correctAnswer,
            explanation: 'Review the concept for better understanding.',
            points: 10 + (lvl - 1) * 5, order: qi,
          });
        }
      }
    }
    console.log('✅ Levels and questions (40 per level) created for all topics');

    // Create slots - (Removed automatic slot creation as requested)
    /*
    const today = new Date();
    const slotTemplates = [
      { startTime: '09:00', endTime: '10:00', slotLabel: 'Slot 1' },
      { startTime: '11:00', endTime: '12:00', slotLabel: 'Slot 2' },
      { startTime: '14:00', endTime: '15:00', slotLabel: 'Slot 3' },
      { startTime: '16:00', endTime: '17:00', slotLabel: 'Slot 4' },
    ];

    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      for (const tmpl of slotTemplates) {
        await Slot.create({ date: dateStr, ...tmpl, maxStudents: 30 });
      }
    }
    console.log('✅ Slots created for next 7 days');
    */

    console.log('\n🎉 Database seeded successfully!');
    console.log('📧 Admin: admin@cogniq.com | 🔐 Password: admin123');
    console.log('📧 Student: student@cogniq.com | 🔐 Password: student123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedDB();
