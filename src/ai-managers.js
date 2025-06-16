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

    // 특정 엔티티를 그룹에서 제거
    removeEntity(entity) {
        for (const groupId in this.groups) {
            const group = this.groups[groupId];
            group.members = group.members.filter(m => m !== entity);
        }
    }

    // 모든 그룹의 AI를 업데이트
    update(player, mapManager, monsterManager, onPlayerAttack, onGainExp) {
        const playerGroup = this.groups['player_party'];
        const monsterGroup = this.groups['dungeon_monsters'];

        if (playerGroup) {
            for (const member of playerGroup.members) {
                if (member.isPlayer) continue; // 플레이어는 직접 제어
                if (typeof member.update === 'function') {
                    member.update({
                        player,
                        allies: playerGroup.members,
                        enemies: monsterGroup ? monsterGroup.members : [],
                        mapManager,
                        monsterManager,
                        onGainExp
                    });
                    if (member.hp <= 0) this.removeEntity(member);
                }
            }
        }

        if (monsterGroup) {
            for (const member of monsterGroup.members) {
                if (typeof member.update === 'function') {
                    member.update({
                        player,
                        allies: monsterGroup.members,
                        enemies: playerGroup ? playerGroup.members : [],
                        mapManager,
                        onPlayerAttack,
                        monsterManager
                    });
                    if (member.hp <= 0) this.removeEntity(member);
                }
            }
        }
    }
}
