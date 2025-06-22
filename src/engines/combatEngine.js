import { Item } from '../entities.js';
import { debugLog } from '../utils/logger.js';

export class CombatEngine {
    constructor(eventManager, managers, assets) {
        this.eventManager = eventManager;
        this.managers = managers;
        this.assets = assets || {};

        const { combatCalculator, vfxManager, effectManager, microCombatManager, itemManager } = managers;

        if (this.eventManager) {
            this.eventManager.subscribe('entity_attack', data => {
                if (!data.attacker || !data.defender) return;
                microCombatManager.resolveAttack(data.attacker, data.defender);
                combatCalculator.handleAttack(data);
                if (!data.skill || !data.skill.projectile) {
                    vfxManager.addSpriteEffect(this.assets['strike-effect'], data.defender.x, data.defender.y, {
                        width: data.defender.width,
                        height: data.defender.height,
                    });
                }
            });

            this.eventManager.subscribe('damage_calculated', data => {
                data.defender.takeDamage(data.damage);
                this.eventManager.publish('entity_damaged', { ...data });
                if (data.defender.hp <= 0) {
                    this.eventManager.publish('entity_death', { attacker: data.attacker, victim: data.defender });
                }
            });

            this.eventManager.subscribe('entity_damaged', data => {
                vfxManager.flashEntity(data.defender, { color: 'rgba(255, 100, 100, 0.6)' });
                const sleepEffect = data.defender.effects.find(e => e.id === 'sleep');
                if (sleepEffect) {
                    sleepEffect.hitsTaken = (sleepEffect.hitsTaken || 0) + 1;
                    if (sleepEffect.hitsTaken >= (sleepEffect.wakeUpOnHit || 1)) {
                        effectManager.removeEffect(data.defender, sleepEffect);
                    }
                }
            });

            this.eventManager.subscribe('entity_death', data => {
                vfxManager.addDeathAnimation(data.victim, 'explode');
                if (!data.victim.isFriendly && (data.attacker.isPlayer || data.attacker.isFriendly)) {
                    const exp = data.victim.expValue || 0;
                    if (exp > 0) this.eventManager.publish('exp_gained', { player: data.attacker, exp });
                }
                if (data.victim.unitType === 'monster') {
                    const corpse = new Item(data.victim.x, data.victim.y, data.victim.tileSize, 'corpse', this.assets.corpse);
                    itemManager.addItem(corpse);
                }
            });

            this.eventManager.subscribe('exp_gained', data => {
                if (!data.applied && data.player?.stats) {
                    data.player.stats.addExp(data.exp);
                }
            });
        }

        console.log('[CombatEngine] Initialized');
        debugLog('[CombatEngine] Initialized');
    }

    update() {
        // Reserved for future combat ticks
    }
}
