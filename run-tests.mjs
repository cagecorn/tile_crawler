import { readdir } from 'fs/promises';

const files = ['ai.test.js', 'eventManager.integration.test.js'];
for (const file of files) {
    console.log(`--- Running ${file} ---`);
    await import(`./tests/${file}`);
}
