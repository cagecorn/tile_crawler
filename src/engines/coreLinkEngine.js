import { debugLog } from '../utils/logger.js';

export class CoreLinkEngine {
    constructor() {
        this.engines = new Map();
        console.log('[CoreLinkEngine] Initialized');
        debugLog('[CoreLinkEngine] Initialized');
    }

    /**
     * 엔진을 등록합니다.
     * @param {string} name - 엔진의 이름 (예: 'vfxEngine')
     * @param {object} engineInstance - 등록할 엔진의 인스턴스
     */
    register(name, engineInstance) {
        if (this.engines.has(name)) {
            console.warn(`[CoreLinkEngine] Engine '${name}' is already registered. Overwriting.`);
        }
        this.engines.set(name, engineInstance);
        debugLog(`[CoreLinkEngine] Registered: ${name}`);
    }

    /**
     * 여러 엔진을 한 번에 등록합니다.
     * @param {object} engineMap - { name: instance } 형태의 객체
     */
    registerMany(engineMap) {
        for (const [name, instance] of Object.entries(engineMap)) {
            this.register(name, instance);
        }
    }

    /**
     * 등록된 엔진을 가져옵니다.
     * @param {string} name - 가져올 엔진의 이름
     * @returns {object|null} - 요청한 엔진의 인스턴스
     */
    get(name) {
        if (!this.engines.has(name)) {
            debugLog(`[CoreLinkEngine] Engine '${name}' not found.`);
            return null;
        }
        return this.engines.get(name);
    }

    /**
     * 등록된 엔진 여부를 확인합니다.
     * @param {string} name
     * @returns {boolean}
     */
    has(name) {
        return this.engines.has(name);
    }

    /**
     * 엔진 등록을 해제합니다.
     * @param {string} name
     */
    unregister(name) {
        this.engines.delete(name);
    }
}

