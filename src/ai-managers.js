// src/ai-managers.js

export const STRATEGY = {
    IDLE: 'idle',
    AGGRESSIVE: 'aggressive',
    DEFENSIVE: 'defensive',
};

class AIGroup {
    constructor(id, strategy = STRATEGY.AGGRESSIVE) {
        this.id = id;
        this.members = [];
        this.strategy = strategy;
    }
    addMember(entity) { this.members.push(entity); }
    removeMember(entityId) {
        this.members = this.members.filter(m => m.id !== entityId);
    }
}

export class MetaAIManager {
    constructor(eventManager) {
        this.groups = {};
        // "몬스터 제거" 이벤트를 구독하여 그룹에서 멤버를 제거
        eventManager.subscribe('entity_removed', (data) => {
            for (const groupId in this.groups) {
                this.groups[groupId].removeMember(data.victimId);
            }
        });
    }

    createGroup(id, strategy) {
        if (!this.groups[id]) {
            this.groups[id] = new AIGroup(id, strategy);
        }
        return this.groups[id];
    }
    
    setGroupStrategy(id, strategy) { /* ... */ }

    executeAction(entity, action, context) {
        if (!action || !action.type || action.type === 'idle') return;
        const { eventManager } = context;

        switch (action.type) {
            case 'attack':
                if (entity.attackCooldown === 0) {
                    // 공격 이벤트를 발행
                    eventManager.publish('entity_attack', { attacker: entity, defender: action.target });
                    entity.attackCooldown = 60;
                }
                break;
            case 'move':
                const dx = action.target.x - entity.x;
                const dy = action.target.y - entity.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 1) {
                    let moveX = (dx / distance) * entity.speed;
                    let moveY = (dy / distance) * entity.speed;
                    const newX = entity.x + moveX;
                    const newY = entity.y + moveY;
                    if (!context.mapManager.isWallAt(newX, newY, entity.width, entity.height)) {
                        entity.x = newX;
                        entity.y = newY;
                    }
                }
                break;
        }
    }

    update(context) {
        for (const groupId in this.groups) {
            const group = this.groups[groupId];
            const currentContext = {
                ...context,
                allies: group.members,
                enemies: Object.values(this.groups).filter(g => g.id !== groupId).flatMap(g => g.members)
            };

            for (const member of [...group.members]) { // 복사본 순회!
                if (member.hp <= 0) continue;
                if (member.attackCooldown > 0) member.attackCooldown--;
                if (member.ai) {
                    const action = member.ai.decideAction(member, currentContext);
                    this.executeAction(member, action, currentContext);
                }
            }
        }
    }
}
