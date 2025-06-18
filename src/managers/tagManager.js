export class TagManager {
    constructor() {
        console.log("[TagManager] Initialized");
    }

    /**
     * 대상(아이템, 스킬 등)이 특정 태그를 가지고 있는지 확인합니다.
     * @param {object} target - 검사할 대상 (item, skill 등)
     * @param {string} tag - 확인할 태그
     * @returns {boolean}
     */
    hasTag(target, tag) {
        return target && Array.isArray(target.tags) && target.tags.includes(tag);
    }
}
