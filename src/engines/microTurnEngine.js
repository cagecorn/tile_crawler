import { MicroTurnManager } from '../micro/MicroTurnManager.js';
import { debugLog } from '../utils/logger.js';

export class MicroTurnEngine {
    constructor(microTurnManager = new MicroTurnManager()) {
        this.turnManager = microTurnManager;
        console.log('[MicroTurnEngine] Initialized');
        debugLog('[MicroTurnEngine] Initialized');
    }

    update(items) {
        this.turnManager.update(items);
    }
}
