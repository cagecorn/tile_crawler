import { SKILLS } from '../data/skills.js';
import { AI_PLAYBOOK } from '../data/aiPlaybook.js';
import { MBTIEngine } from './mbtiEngine.js';

export const STRATEGY = {
    IDLE: 'idle',
    AGGRESSIVE: 'aggressive',
    DEFENSIVE: 'defensive',
};

export class AIEngine {
    constructor(eventManager, mbtiEngine) {
        this.eventManager = eventManager;
        this.mbtiEngine = mbtiEngine || new MBTIEngine();
        this.groups = {};
        this.activeTactics = {};
        this.tacticsEnabled = false;

        eventManager.subscribe('entity_removed', (data) => {
            for (const groupId in this.groups) {
                this.groups[groupId]?.removeMember?.(data.victimId);
            }
        });
        console.log('[AIEngine] Initialized');
    }

    setTacticsEnabled(enabled) {
        this.tacticsEnabled = !!enabled;
    }

    createGroup(id, strategy = STRATEGY.AGGRESSIVE) {
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

    setGroupStrategy(id, strategy) {
        if (this.groups[id]) {
            this.groups[id].strategy = strategy;
        }
    }
    
    addMember(groupId, member) {
        if (this.groups[groupId]) {
            this.groups[groupId].addMember(member);
        }
    }

    update(context) {
        for (const groupId in this.groups) {
            const group = this.groups[groupId];
            if (group.strategy === STRATEGY.IDLE) {
                // Skip any action processing for idle groups
                continue;
            }
            const currentContext = {
                ...context,
                allies: group.members,
                enemies: Object.values(this.groups).filter(g => g.id !== groupId).flatMap(g => g.members)
            };

            if (!this.tacticsEnabled) {
                this.executeIndividualBehaviors(currentContext);
                continue;
            }

            let activeTactic = this.activeTactics[groupId];

            if (activeTactic && activeTactic.life > 0) {
                activeTactic.life--;
                if (activeTactic.update) {
                    activeTactic.update(activeTactic, currentContext);
                }
                this.refreshTacticRoles(activeTactic, currentContext);
            } else {
                activeTactic = this.chooseBestTactic(currentContext);
                this.activeTactics[groupId] = activeTactic;
            }

            if (activeTactic) {
                this.executeTactic(activeTactic, currentContext);
            } else {
                this.executeIndividualBehaviors(currentContext);
            }
        }
    }

    chooseBestTactic(context) {
        if (context.enemies.length === 0) return null;

        const options = [];
        for (const id in AI_PLAYBOOK) {
            const t = AI_PLAYBOOK[id];
            if (t.condition(context)) {
                options.push({ ...t, id, score: t.score(context) });
            }
        }

        if (options.length === 0) return null;
        options.sort((a, b) => b.score - a.score);
        const topScore = options[0].score;
        const bestOptions = options.filter(o => o.score === topScore);
        const best = bestOptions[Math.floor(Math.random() * bestOptions.length)];
        this.eventManager.publish('log', { message: `[전술] ${best.name} 개시!`, color: 'gold' });
        return {
            ...best,
            life: best.duration,
            stage: 'initial',
            rolesDef: best.roles,
            roles: this.assignRoles(best.roles, context)
        };
    }

    assignRoles(roleDefs, context) {
        const assignments = {};
        const available = [...context.allies];

        for (const def of roleDefs) {
            assignments[def.name] = [];
            if (def.selector) {
                const chosen = def.selector(context, assignments);
                if (chosen) {
                    assignments[def.name].push(chosen);
                    const idx = available.indexOf(chosen);
                    if (idx !== -1) available.splice(idx, 1);
                }
            } else {
                const count = def.count === 'all' ? available.length : def.count;
                for (let i = 0; i < count; i++) {
                    if (available.length === 0) break;
                    assignments[def.name].push(available.shift());
                }
            }
        }

        return assignments;
    }

    refreshTacticRoles(tactic, context) {
        if (!tactic || !tactic.roles) return;
        const roleDefs = tactic.rolesDef || [];
        for (const def of roleDefs) {
            const current = tactic.roles[def.name] || [];
            const alive = current.filter(e => context.allies.includes(e));
            tactic.roles[def.name] = alive;
            const needed = def.count === 'all' ? context.allies.length : def.count;
            if (alive.length < needed) {
                const pool = context.allies.filter(a =>
                    !Object.values(tactic.roles).some(list => list.includes(a)));
                const fillCount = needed === 'all' ? pool.length : needed - alive.length;
                for (let i = 0; i < fillCount; i++) {
                    if (pool.length === 0) break;
                    const ent = def.selector ? def.selector(context, tactic.roles) : pool.shift();
                    if (ent) tactic.roles[def.name].push(ent);
                }
            }
        }
    }

    executeTactic(tactic, context) {
        const assignments = tactic.roles;
        for (const roleName in assignments) {
            const roleDef = tactic.rolesDef?.find(r => r.name === roleName);
            const entities = assignments[roleName];
            if (!roleDef || !roleDef.action) continue;
            for (const entity of entities) {
                const action = roleDef.action(entity, assignments, tactic);
                this.executeAction(entity, action, context);
            }
        }
    }

    executeIndividualBehaviors(context) {
        const membersSorted = [...context.allies].sort((a,b) => (b.attackSpeed || 1) - (a.attackSpeed || 1));
        console.log(`[AIEngine] Processing ${membersSorted.length} members`);
        for (const member of membersSorted) {
            if (member.hp <= 0 || member.isPlayer) {
                console.log(`[AIEngine] Skipping member: hp=${member.hp}, behaviors=${!!member.behaviors}, isPlayer=${member.isPlayer}`);
                continue;
            }
            if (!member.behaviors || member.behaviors.length === 0) {
                if (member.ai && typeof member.ai.decideAction === 'function') {
                    const baseAction = member.ai.decideAction(member, context) || { type: 'idle' };
                    const { finalAction, triggeredTraits } = this.mbtiEngine.refineAction(baseAction, member, context);
                    finalAction.triggeredTraits = triggeredTraits;
                    this.executeAction(member, finalAction, context);
                }
                continue;
            }
            if (Array.isArray(member.effects) && member.effects.some(e => e.tags && e.tags.includes('cc'))) continue;

            let baseAction = { type: 'idle' };
            for (const behavior of member.behaviors) {
                const action = behavior.decideAction(member, context);
                if (action && action.type !== 'idle') {
                    baseAction = action;
                    break;
                }
            }

            const { finalAction, triggeredTraits } = this.mbtiEngine.refineAction(baseAction, member, context);
            finalAction.triggeredTraits = triggeredTraits;
            console.log(`[AIEngine] Member action:`, finalAction);
            this.executeAction(member, finalAction, context);
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
                if (movementManager) {
                    movementManager.moveEntityTowards(entity, action.target, context);
                } else {
                    const dx = action.target.x - entity.x;
                    const dy = action.target.y - entity.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance > 5) {
                        const speed = entity.speed || 2;
                        entity.x += (dx / distance) * speed;
                        entity.y += (dy / distance) * speed;
                    }
                }
                break;
        }
    }
}
