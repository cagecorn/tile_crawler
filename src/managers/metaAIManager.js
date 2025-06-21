import { MetaAIManager as BaseMetaAI } from './ai-managers.js';

export class MetaAIManager extends BaseMetaAI {
    executeAction(entity, action, context) {
        if (!action) return;
        const { player, mapManager, onPlayerAttack, onMonsterAttacked } = context;
        switch (action.type) {
            case 'attack':
                if (entity.attackCooldown === 0) {
                    if (entity.isFriendly) {
                        onMonsterAttacked(action.target.id, entity.attackPower);
                    } else {
                        onPlayerAttack(entity.attackPower);
                    }
                    const baseCd = 60;
                    entity.attackCooldown = Math.max(1, Math.round(baseCd / (entity.attackSpeed || 1)));
                }
                break;
            case 'move':
                const dx = action.target.x - entity.x;
                const dy = action.target.y - entity.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= entity.speed) {
                    if (!mapManager.isWallAt(action.target.x, action.target.y, entity.width, entity.height)) {
                        entity.x = action.target.x;
                        entity.y = action.target.y;
                    }
                } else {
                    let moveX = (dx / distance) * entity.speed;
                    let moveY = (dy / distance) * entity.speed;
                    const newX = entity.x + moveX;
                    const newY = entity.y + moveY;
                    if (!mapManager.isWallAt(newX, newY, entity.width, entity.height)) {
                        entity.x = newX;
                        entity.y = newY;
                    }
                }
                break;
            case 'idle':
            default:
                break;
        }
    }

    update(context) {
        for (const groupId in this.groups) {
            const group = this.groups[groupId];
            const membersSorted = [...group.members].sort((a,b)=>(b.attackSpeed||1)-(a.attackSpeed||1));
            for (const member of membersSorted) {
                if (member.hp <= 0 || member.possessedBy) continue;
                if (typeof member.update === 'function') {
                    member.update({ ...context, metaAIManager: this });
                } else {
                    if (member.attackCooldown > 0) member.attackCooldown--;
                    if (member.ai) {
                        const action = member.ai.decideAction(member, context);
                        this.executeAction(member, action, context);
                    }
                }
            }
        }
    }
}
