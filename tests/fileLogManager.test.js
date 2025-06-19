import { FileLogManager } from '../src/managers/fileLogManager.js';
import { EventManager } from '../src/managers/eventManager.js';
import fs from 'fs';
import { describe, test, assert } from './helpers.js';

const LOG_FILE = 'test-combat.log';

describe('FileLogManager', () => {
    test('writes log messages to file', () => {
        if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
        const eventManager = new EventManager();
        const fileLogger = new FileLogManager(eventManager, LOG_FILE);
        eventManager.publish('log', { message: 'hello world' });
        const content = fs.readFileSync(LOG_FILE, 'utf8');
        assert.ok(content.includes('hello world'));
        fs.unlinkSync(LOG_FILE);
    });
});
