import { debugLog } from '../utils/logger.js';

export class StatEngine {
    constructor(eventManager) {
        this.eventManager = eventManager;
        if (this.eventManager) {
            this.eventManager.subscribe('exp_gained', data => {
                // 모든 엔티티의 경험치를 처리할 수 있도록 data.entity 사용
                if (data.entity?.stats) {
                    data.entity.stats.addExp(data.exp);
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
