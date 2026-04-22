const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const { getAllStudents } = require('./controllers/adminController');
const User = require('./models/User');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Create a student if none exists
    let student = await User.findOne({ role: 'student' });
    if (!student) {
        student = await User.create({
            name: 'Test Student',
            email: 'test_student_' + Date.now() + '@example.com',
            password: 'password123',
            role: 'student',
            isActive: true
        });
    }

    // Capture initial count
    const req = { user: { role: 'admin' } };
    const res = {
        json: function(data) { this.data = data; }
    };
    
    await getAllStudents(req, res);
    const initialCount = res.data.students.length;
    console.log('Initial Students:', initialCount);

    // Deactivate student
    await User.findByIdAndUpdate(student._id, { isActive: false });
    
    // Re-fetch
    await getAllStudents(req, res);
    const finalCount = res.data.students.length;
    console.log('Final Students after deactivation:', finalCount);

    if (finalCount === initialCount - 1) {
        console.log('SUCCESS: Deactivated student is filtered out.');
    } else {
        console.log('FAILURE: Student count did not decrease as expected.');
    }

    // Cleanup
    await User.findByIdAndRemove(student._id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verify();
