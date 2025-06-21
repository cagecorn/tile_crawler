import { SKILLS } from '../data/skills.js';

export class AIEngine {
    constructor(eventManager, mbtiEngine) {
        this.eventManager = eventManager;
        this.mbtiEngine = mbtiEngine;
        this.groups = {};

        eventManager.subscribe('entity_removed', (data) => {
            for (const groupId in this.groups) {
                this.groups[groupId]?.removeMember?.(data.victimId);
            }
        });
        console.log('[AIEngine] Initialized');
    }

    createGroup(id, strategy) {
        if (!this.groups[id]) {
            this.groups[id] = {
                id,
                strategy,
                members: [],
                addMember(entity) { this.members.push(entity); },
                removeMember(entityId) { this.members = this.members.filter(m => m.id !== entityId); }
            };
        }
        return this.groups[id];
    }
    
    addMember(groupId, member) {
        if (this.groups[groupId]) {
            this.groups[groupId].addMember(member);
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
                if (member.hp <= 0 || !member.behaviors || member.isPlayer) continue;
                
                if (typeof member.update === 'function') member.update(currentContext);
                if (Array.isArray(member.effects) && member.effects.some(e => e.tags && e.tags.includes('cc'))) continue;

                let baseAction = { type: 'idle' };
                for (const behavior of member.behaviors) {
                    const action = behavior.decideAction(member, currentContext);
                    if (action && action.type !== 'idle') {
                        baseAction = action;
                        break; 
                    }
                }

                const { finalAction, triggeredTraits } = this.mbtiEngine.refineAction(baseAction, member, currentContext);
                finalAction.triggeredTraits = triggeredTraits;

                this.executeAction(member, finalAction, currentContext);
            }
        }
    }

    executeAction(entity, action, context) {
        if (!action || !action.type || action.type === 'idle') return;
        const { eventManager, movementManager } = context;

        if (action.triggeredTraits) {
            action.triggeredTraits.forEach(trait => {
                eventManager.publish('ai_mbti_trait_triggered', { entity, trait });
            });
        }

        switch (action.type) {
            case 'attack':
                if (entity.attackCooldown <= 0) {
                    eventManager.publish('entity_attack', { attacker: entity, defender: action.target });
                    entity.attackCooldown = Math.max(1, Math.round(60 / (entity.attackSpeed || 1)));
                }
                break;
            case 'skill': {
                const skill = SKILLS[action.skillId];
                if (skill && entity.mp >= skill.manaCost && (entity.skillCooldowns[action.skillId] || 0) <= 0) {
                    entity.mp -= skill.manaCost;
                    entity.skillCooldowns[action.skillId] = skill.cooldown;
                    eventManager.publish('skill_used', { caster: entity, skill, target: action.target });
                }
                break; }
            case 'move':
                if (movementManager) movementManager.moveEntityTowards(entity, action.target, context);
                break;
        }
    }
}
