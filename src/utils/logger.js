import { DEBUG } from '../../config/debug.js';

export function debugLog(...args) {
    if (DEBUG) console.log(...args);
}
