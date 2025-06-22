import { debugLog } from '../utils/logger.js';

export class MovementEngine {
    constructor(eventManager, movementManager) {
        this.eventManager = eventManager;
        this.movementManager = movementManager;
        if (this.eventManager) {
            this.eventManager.subscribe('move_entity', ({ entity, target, context }) => {
                this.movementManager?.moveEntityTowards(entity, target, context);
            });
        }
        console.log('[MovementEngine] Initialized');
        debugLog('[MovementEngine] Initialized');
    }

    update() {
        // Reserved for future movement ticks
    }
}
