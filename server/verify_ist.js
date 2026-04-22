// SIMULATION OF IST CALCULATION
const now = new Date();
const istOffset = 5.5 * 60 * 60 * 1000;
const istDate = new Date(now.getTime() + istOffset);
const todayStr = istDate.toISOString().split('T')[0]; 
const currentTime = istDate.toISOString().split('T')[1].slice(0, 5); // "HH:MM" in IST

console.log('Real Current Time (approx UTC):', now.toISOString());
console.log('Target IST Date:', todayStr);
console.log('Target IST Time:', currentTime);

if (currentTime.match(/^\d{2}:\d{2}$/)) {
    console.log('SUCCESS: Time format is correct HH:MM');
} else {
    console.log('FAILURE: Time format is incorrect');
}
