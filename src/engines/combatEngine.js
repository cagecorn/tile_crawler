import { debugLog } from '../utils/logger.js';

export class CombatEngine {
    constructor(eventManager, managers, assets) {
        this.eventManager = eventManager;
        this.managers = managers;
        this.assets = assets || {};

        const { combatCalculator, effectManager, microCombatManager } = managers;

        if (this.eventManager) {
            this.eventManager.subscribe('entity_attack', data => {
                if (!data.attacker || !data.defender) return;
                microCombatManager.resolveAttack(data.attacker, data.defender);
                combatCalculator.handleAttack(data);
            });


            this.eventManager.subscribe('entity_damaged', data => {
                const sleepEffect = data.defender.effects.find(e => e.id === 'sleep');
                if (sleepEffect) {
                    sleepEffect.hitsTaken = (sleepEffect.hitsTaken || 0) + 1;
                    if (sleepEffect.hitsTaken >= (sleepEffect.wakeUpOnHit || 1)) {
                        effectManager.removeEffect(data.defender, sleepEffect);
                    }
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
