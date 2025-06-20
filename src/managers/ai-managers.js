// src/ai-managers.js
import { SKILLS } from '../data/skills.js';

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

        // 행동 결정 로그는 너무 잦은 호출이 성능 문제를 일으킬 수 있어
        // 간단한 쿨다운 메커니즘으로 빈도를 제한한다.
        if (!entity._aiLogCooldown) entity._aiLogCooldown = 0;
        if (entity._aiLogCooldown <= 0) {
            eventManager.publish('debug', {
                tag: 'AI',
                message: `${entity.constructor.name} (id: ${entity.id.substr(0,4)}) decided action: ${action.type}`
            });
            entity._aiLogCooldown = 30; // 약 0.5초(60fps 기준) 동안 로그 억제
        } else {
            entity._aiLogCooldown--;
        }

        switch (action.type) {
            case 'attack':
                if (entity.attackCooldown === 0) {
                    // 공격 이벤트를 발행
                    eventManager.publish('entity_attack', { attacker: entity, defender: action.target });
                    const weaponTags = entity.equipment?.weapon?.tags || [];
                    const isRanged = weaponTags.includes('ranged') || weaponTags.includes('bow');
                    if (isRanged && context.projectileManager) {
                        const projSkill = { projectile: 'arrow', damage: entity.attackPower };
                        context.projectileManager.create(entity, action.target, projSkill);
                    } else {
                        eventManager.publish('entity_attack', { attacker: entity, defender: action.target });
                    }
                    const baseCd = 60;
                    entity.attackCooldown = Math.max(1, Math.round(baseCd / (entity.attackSpeed || 1)));
                }
                break;
            case 'skill':
                const skill = SKILLS[action.skillId];
                if (
                    skill &&
                    entity.mp >= skill.manaCost &&
                    (entity.skillCooldowns[action.skillId] || 0) <= 0
                ) {
                    entity.mp -= skill.manaCost;
                    entity.skillCooldowns[action.skillId] = skill.cooldown;
                    eventManager.publish('skill_used', { caster: entity, skill, target: action.target });
                    const baseCd = 60;
                    entity.attackCooldown = Math.max(1, Math.round(baseCd / (entity.attackSpeed || 1)));
                }
                break;
            case 'charge_attack': {
                const { eventManager: ev } = context;
                const { target, skill } = action;
                ev.publish('vfx_request', {
                    type: 'dash_trail',
                    from: { x: entity.x, y: entity.y },
                    to: { x: target.x, y: target.y }
                });
                const dx = target.x - entity.x;
                const dy = target.y - entity.y;
                const dist = Math.hypot(dx, dy) || 1;
                entity.x = target.x - (dx / dist) * entity.width;
                entity.y = target.y - (dy / dist) * entity.height;
                ev.publish('entity_attack', { attacker: entity, defender: target, skill });
                entity.mp -= skill.manaCost;
                entity.skillCooldowns[skill.id] = skill.cooldown;
                entity.attackCooldown = Math.max(1, Math.round(60 / (entity.attackSpeed || 1)));
                break; }
            case 'move':
                const { movementManager } = context;
                if (movementManager) {
                    movementManager.moveEntityTowards(entity, action.target);
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

            const membersSorted = [...group.members].sort((a,b) => (b.attackSpeed || 1) - (a.attackSpeed || 1));
            for (const member of membersSorted) {
                if (member.hp <= 0) continue;

                // 1단계: 쿨다운 감소 등 상태 업데이트
                if (typeof member.update === 'function') {
                    member.update(currentContext);
                } else {
                    if (member.attackCooldown > 0) member.attackCooldown--;
                    if (typeof member.applyRegen === 'function') member.applyRegen();
                }

                // 2단계: 업데이트 이후 행동 결정 및 실행
                let action = { type: 'idle' };
                if (group.strategy !== STRATEGY.IDLE && member.ai) {
                    action = member.ai.decideAction(member, currentContext);
                }
                this.executeAction(member, action, currentContext);
            }
        }
    }
}
