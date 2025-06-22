import { debugLog } from '../utils/logger.js';

export class StatEngine {
    constructor(eventManager) {
        this.eventManager = eventManager;
        if (this.eventManager) {
            this.eventManager.subscribe('exp_gained', data => {
                if (!data.applied && data.player?.stats) {
                    data.player.stats.addExp(data.exp);
                }
            });
        }
        console.log('[StatEngine] Initialized');
        debugLog('[StatEngine] Initialized');
    }

    update() {
        // Reserved for future stat-related ticks
    }
}
