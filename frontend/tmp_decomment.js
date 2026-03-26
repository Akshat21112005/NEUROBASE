
const decomment = require('decomment');
const fs = require('fs');
try {
    const code = fs.readFileSync('c:\\Users\\Akshat Bhatt\\NEUROBASE\\NEUROBASE\\frontend\\src\\utils\\motion.js', 'utf8');
    const stripped = decomment(code);
    fs.writeFileSync('c:\\Users\\Akshat Bhatt\\NEUROBASE\\NEUROBASE\\frontend\\src\\utils\\motion.js', stripped);
} catch (e) {
    console.error('Error stripping JS comments for c:\Users\Akshat Bhatt\NEUROBASE\NEUROBASE\frontend\src\utils\motion.js:', e.message);
}
