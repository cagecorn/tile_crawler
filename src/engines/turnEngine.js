import { TurnManager } from '../managers/turnManager.js';
import { debugLog } from '../utils/logger.js';

export class TurnEngine {
    constructor(eventManager, turnManager = new TurnManager()) {
        this.eventManager = eventManager;
        this.turnManager = turnManager;
        console.log('[TurnEngine] Initialized');
        debugLog('[TurnEngine] Initialized');
    }

    update(entities, context = {}) {
        const { player = null, parasiteManager = null } = context;
        this.turnManager.update(entities, {
            eventManager: this.eventManager,
            player,
            parasiteManager,
        });
    }
}
