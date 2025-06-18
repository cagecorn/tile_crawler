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
    
    setGroupStrategy(id, strategy) {
        if (this.groups[id]) {
            this.groups[id].strategy = strategy;
        }
    }

    executeAction(entity, action, context) {
        if (!action || !action.type || action.type === 'idle') return;
        const { eventManager } = context;

        // 행동 결정 로그
        eventManager.publish('debug', {
            tag: 'AI',
            message: `${entity.constructor.name} (id: ${entity.id.substr(0,4)}) decided action: ${action.type}`
        });

        switch (action.type) {
            case 'attack':
                if (entity.attackCooldown === 0) {
                    // 공격 이벤트를 발행
                    eventManager.publish('entity_attack', { attacker: entity, defender: action.target });
                    entity.attackCooldown = 60;
                }
                break;
            case 'move':
                const tileSize = context.mapManager.tileSize;
                const startX = Math.floor(entity.x / tileSize);
                const startY = Math.floor(entity.y / tileSize);
                const endX = Math.floor(action.target.x / tileSize);
                const endY = Math.floor(action.target.y / tileSize);
                const path = context.pathfindingManager.findPath(startX, startY, endX, endY);
                let targetX, targetY;
                if (path.length > 0) {
                    const next = path[0];
                    targetX = next.x * tileSize;
                    targetY = next.y * tileSize;
                } else {
                    targetX = action.target.x;
                    targetY = action.target.y;
                    if (context.mapManager.isWallAt(targetX, targetY, entity.width, entity.height)) {
                        break; // 이동 불가한 목표
                    }
                }

                const dx = targetX - entity.x;
                const dy = targetY - entity.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= entity.speed) {
                    if (!context.mapManager.isWallAt(targetX, targetY, entity.width, entity.height)) {
                        entity.x = targetX;
                        entity.y = targetY;
                    }
                } else {
                    let moveX = (dx / distance) * entity.speed;
                    let moveY = (dy / distance) * entity.speed;
                    const newX = entity.x + moveX;
                    const newY = entity.y + moveY;
                    if (!context.mapManager.isWallAt(newX, newY, entity.width, entity.height)) {
                        entity.x = newX;
                        entity.y = newY;
                    } else {
                        // Slide along walls when diagonal movement is blocked
                        if (!context.mapManager.isWallAt(newX, entity.y, entity.width, entity.height)) {
                            entity.x = newX;
                        } else if (!context.mapManager.isWallAt(entity.x, newY, entity.width, entity.height)) {
                            entity.y = newY;
                        }
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

                let action = { type: 'idle' };
                if (group.strategy !== STRATEGY.IDLE && member.ai) {
                    action = member.ai.decideAction(member, currentContext);
                }
                this.executeAction(member, action, currentContext);
            }
        }
    }
}
