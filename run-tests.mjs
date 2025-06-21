import { readdir } from 'fs/promises';

// Dynamically discover all test files in the tests directory.
const files = (await readdir('./tests')).filter(f => f.endsWith('.test.js'));

for (const file of files) {
    console.log(`--- Running ${file} ---`);
    await import(`./tests/${file}`);
}
