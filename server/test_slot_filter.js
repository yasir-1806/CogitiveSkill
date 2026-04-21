const now = new Date();
const todayStr = now.toLocaleDateString('en-CA');
const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

console.log('Current Date:', todayStr);
console.log('Current Time:', currentTime);

// Mock slots
const slots = [
  { date: todayStr, startTime: '08:00', endTime: '09:00', slotLabel: 'Past Slot Today' },
  { date: todayStr, startTime: '22:00', endTime: '23:00', slotLabel: 'Future Slot Today' },
  { date: '2026-12-31', startTime: '09:00', endTime: '10:00', slotLabel: 'Future Date Slot' }
];

const filterSlots = (slots, userRole) => {
  return slots.filter(slot => {
    // Rule for both students and admins: Hide today's slots if they have already ended
    if (slot.date === todayStr && slot.endTime <= currentTime) {
      return false;
    }

    if (userRole === 'student') {
       // ... student rules ...
       return slot.date === todayStr; // simplified for test
    }

    return true;
  });
};

console.log('Admin View:', filterSlots(slots, 'admin').map(s => s.slotLabel));
console.log('Student View:', filterSlots(slots, 'student').map(s => s.slotLabel));
