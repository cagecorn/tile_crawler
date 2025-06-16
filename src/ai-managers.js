// src/ai-managers.js

// 전략의 종류를 미리 정의합니다.
export const STRATEGY = {
    IDLE: 'idle', // 대기
    AGGRESSIVE: 'aggressive', // 공격적
    DEFENSIVE: 'defensive', // 방어적
};

// 유닛 그룹을 정의하는 클래스
class AIGroup {
    constructor(id, strategy = STRATEGY.AGGRESSIVE) {
        this.id = id;
        this.members = [];
        this.strategy = strategy;
    }

    addMember(entity) {
        this.members.push(entity);
    }
}

// 모든 AI 그룹을 관리하는 메타 매니저
export class MetaAIManager {
    constructor() {
        this.groups = {};
    }

    createGroup(id, strategy) {
        if (!this.groups[id]) {
            this.groups[id] = new AIGroup(id, strategy);
        }
        return this.groups[id];
    }

    getGroup(id) {
        return this.groups[id];
    }

    // 그룹의 전략을 변경하는 함수
    setGroupStrategy(id, strategy) {
        if (this.groups[id]) {
            this.groups[id].strategy = strategy;
        }
    }

    // 모든 그룹의 AI를 업데이트
    update(player, mapManager, onPlayerAttack) {
        for (const groupId in this.groups) {
            const group = this.groups[groupId];
            for (const member of group.members) {
                // 각 멤버에게 그룹의 현재 전략을 알려주며 업데이트
                member.update(group.strategy, player, mapManager, onPlayerAttack);
            }
        }
    }
}
