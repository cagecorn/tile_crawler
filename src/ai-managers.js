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
    removeMember(entityId) { this.members = this.members.filter(m => m.id !== entityId); }
}

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
    
    setGroupStrategy(id, strategy) { /* ... */ }

    executeAction(entity, action, context) {
        if (!action || !action.type || action.type === 'idle') return;

        const { onPlayerAttacked, onMonsterAttacked } = context;

        switch (action.type) {
            case 'attack':
                if (entity.attackCooldown === 0) {
                    const target = action.target;
                    if (entity.isFriendly) {
                        onMonsterAttacked(target.id, entity.attackPower);
                    } else {
                        onPlayerAttacked(entity.attackPower, target);
                    }
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

            for (const member of group.members) {
                if (member.attackCooldown > 0) member.attackCooldown--;
                if (member.ai) {
                    const action = member.ai.decideAction(member, currentContext);
                    this.executeAction(member, action, currentContext);
                }
            }
        }
    }
}
