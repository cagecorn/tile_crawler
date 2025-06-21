// AI Tactics Playbook

// Tactical behavior helpers
const TACTICAL_ACTIONS = {
    ENGAGE_AND_HOLD: (entity, target) => {
        if (!target) return { type: 'idle' };
        const distance = Math.hypot(target.x - entity.x, target.y - entity.y);
        if (distance < (entity.attackRange || 1)) {
            return { type: 'attack', target };
        }
        return { type: 'move', target };
    },
    FLANK: (entity, target, direction = 'left') => {
        if (!target) return { type: 'idle' };
        const offsetAngle = direction === 'left' ? -Math.PI / 2 : Math.PI / 2;
        const targetAngle = Math.atan2(target.y - entity.y, target.x - entity.x);
        const finalAngle = targetAngle + offsetAngle;
        const flankPos = {
            x: target.x + Math.cos(finalAngle) * 100,
            y: target.y + Math.sin(finalAngle) * 100,
        };
        const dist = Math.hypot(flankPos.x - entity.x, flankPos.y - entity.y);
        if (dist < (entity.attackRange || 1)) {
            return { type: 'attack', target };
        }
        return { type: 'move', target: flankPos };
    },
    PURSUE: (entity, target) => target ? { type: 'move', target } : { type: 'idle' },
    ATTACK: (entity, target) => target ? { type: 'attack', target } : { type: 'idle' },
    IDLE: () => ({ type: 'idle' })
};

export const AI_PLAYBOOK = {
    // Hammer and Anvil tactic
    hammer_and_anvil: {
        name: '망치와 모루',
        condition: (ctx) => {
            const anvils = ctx.allies.filter(a => a.equipment?.off_hand?.tags?.includes('shield'));
            const hammers = ctx.allies.filter(a => !a.equipment?.off_hand?.tags?.includes('shield'));
            return anvils.length >= 1 && hammers.length >= 1 && ctx.enemies.length > 0;
        },
        score: (ctx) => 150 / (ctx.enemies.length || 1),
        roles: [
            {
                name: 'anvil',
                count: 1,
                selector: (ctx) => ctx.allies.filter(a => a.equipment?.off_hand?.tags?.includes('shield')).sort((a,b) => (b.stats?.get('defense') || 0) - (a.stats?.get('defense') || 0))[0],
                action: (self, roles) => {
                    if (!roles.target?.[0]) return TACTICAL_ACTIONS.IDLE();
                    return TACTICAL_ACTIONS.ENGAGE_AND_HOLD(self, roles.target[0]);
                }
            },
            {
                name: 'hammer',
                count: 1,
                selector: (ctx, assigned) => ctx.allies.filter(a => a !== assigned.anvil?.[0] && !a.equipment?.off_hand?.tags?.includes('shield')).sort((a,b) => (b.stats?.get('attackPower') || 0) - (a.stats?.get('attackPower') || 0))[0],
                action: (self, roles) => {
                    if (!roles.target?.[0]) return TACTICAL_ACTIONS.IDLE();
                    return TACTICAL_ACTIONS.FLANK(self, roles.target[0], 'left');
                }
            },
            {
                name: 'target',
                count: 1,
                selector: (ctx, assigned) => {
                    const anvil = assigned.anvil?.[0];
                    if (!anvil) return ctx.enemies[0];
                    return ctx.enemies.slice().sort((a,b) => (
                        Math.hypot(a.x - anvil.x, a.y - anvil.y) -
                        Math.hypot(b.x - anvil.x, b.y - anvil.y)
                    ))[0];
                }
            }
        ],
        duration: 400
    },

    // Pincer Attack
    pincer_attack: {
        name: '포위 섬멸',
        condition: (ctx) => {
            const meleeAllies = ctx.allies.filter(a => !a.equipment?.weapon?.tags?.includes('ranged'));
            return meleeAllies.length >= 2 && ctx.enemies.length === 1;
        },
        score: (ctx) => 100 - ctx.enemies[0].hp,
        roles: [
            {
                name: 'flanker_left',
                count: 1,
                action: (self, roles) => {
                    if (!roles.target?.[0]) return TACTICAL_ACTIONS.IDLE();
                    return TACTICAL_ACTIONS.FLANK(self, roles.target[0], 'left');
                }
            },
            {
                name: 'flanker_right',
                count: 1,
                action: (self, roles) => {
                    if (!roles.target?.[0]) return TACTICAL_ACTIONS.IDLE();
                    return TACTICAL_ACTIONS.FLANK(self, roles.target[0], 'right');
                }
            },
            { name: 'target', count: 1, selector: (ctx) => ctx.enemies[0] }
        ],
        duration: 300
    },

    // Focus Fire Weakest
    focus_fire_weakest: {
        name: '최약체 집중 공격',
        condition: (ctx) => ctx.allies.length >= 2 && ctx.enemies.length >= 2,
        score: () => 80,
        roles: [
            {
                name: 'attackers',
                count: 'all',
                action: (self, roles) => {
                    if (!roles.target?.[0]) return TACTICAL_ACTIONS.IDLE();
                    return TACTICAL_ACTIONS.ENGAGE_AND_HOLD(self, roles.target[0]);
                }
            },
            { name: 'target', count: 1, selector: (ctx) => ctx.enemies.slice().sort((a,b) => a.hp - b.hp)[0] }
        ],
        duration: 240
    },

    // Feigned Retreat (multi-stage)
    feigned_retreat: {
        name: '유인책',
        condition: (ctx) => ctx.allies.length >= 3 && ctx.enemies.length === 1,
        score: () => 90,
        roles: [
            {
                name: 'bait',
                count: 1,
                selector: (ctx) => ctx.allies.slice().sort((a,b) => (b.stats?.get('movementSpeed')||0) - (a.stats?.get('movementSpeed')||0))[0],
                action: (self, roles, tactic) => {
                    const lureTarget = roles.lure_target?.[0];
                    const ambushPoint = roles.ambush_point?.[0];
                    if (!lureTarget || !ambushPoint) return TACTICAL_ACTIONS.IDLE();

                    const d = Math.hypot(lureTarget.x - self.x, lureTarget.y - self.y);
                    if (tactic.stage === 'luring' && d < 300) {
                        tactic.stage = 'retreating';
                    }
                    if (tactic.stage === 'retreating') {
                        return TACTICAL_ACTIONS.PURSUE(self, ambushPoint);
                    }
                    return TACTICAL_ACTIONS.PURSUE(self, lureTarget);
                }
            },
            {
                name: 'ambushers',
                count: 'all',
                action: (self, roles, tactic) => {
                    const lureTarget = roles.lure_target?.[0];
                    if (!lureTarget) return TACTICAL_ACTIONS.IDLE();

                    const d = Math.hypot(lureTarget.x - self.x, lureTarget.y - self.y);
                    if (d < 250) {
                        tactic.stage = 'attack';
                    }
                    if (tactic.stage === 'attack') {
                        return TACTICAL_ACTIONS.ATTACK(self, lureTarget);
                    }
                    return TACTICAL_ACTIONS.IDLE();
                }
            },
            { name: 'lure_target', count: 1, selector: (ctx) => ctx.enemies[0] },
            { name: 'ambush_point', count: 1, selector: (ctx, assigned) => ctx.allies.find(a => a.id !== assigned.bait?.[0]?.id) }
        ],
        duration: 1200,
        update: (tactic, ctx) => {
            if (tactic.stage === 'initial') {
                const bait = tactic.roles.bait?.[0];
                const lureTarget = tactic.roles.lure_target?.[0];
                if (!bait || !lureTarget) return;

                tactic.stage = 'luring';
                const ambushX = bait.x + (bait.x - lureTarget.x);
                const ambushY = bait.y + (bait.y - lureTarget.y);
                tactic.roles.ambush_point[0] = { x: ambushX, y: ambushY };
            }
        }
    }
};
