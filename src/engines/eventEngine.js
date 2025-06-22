import { debugLog } from '../utils/logger.js';

export class EventEngine {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.queue = [];
        console.log('[EventEngine] Initialized');
        debugLog('[EventEngine] Initialized');
    }

    /**
     * 스케줄된 이벤트를 큐에 추가합니다.
     * @param {number} delay - 업데이트 호출 후 남은 프레임 수
     * @param {string} name - 이벤트 이름
     * @param {object} data - 전달할 데이터
     */
    schedule(delay, name, data = {}) {
        this.queue.push({ delay, name, data });
    }

    /**
     * 모든 대기 중인 이벤트의 카운트를 감소시키고, 준비가 되면 발행합니다.
     */
    update() {
        for (let i = this.queue.length - 1; i >= 0; i--) {
            const evt = this.queue[i];
            if (--evt.delay <= 0) {
                this.eventManager.publish(evt.name, evt.data);
                this.queue.splice(i, 1);
            }
        }
    }
}
