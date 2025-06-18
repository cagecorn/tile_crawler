import { rollDiceNotation } from './utils/random.js';

export class CombatCalculator {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    // 공격 이벤트를 처리하여 피해량을 계산한 뒤 이벤트로 발행한다.
    handleAttack(data) {
        const { attacker, defender } = data;

        const result = {};

        const weapon = attacker.equipment?.weapon;
        const diceNotation = weapon && weapon.damageDice ? weapon.damageDice : '1d4';
        result.diceRoll = rollDiceNotation(diceNotation);
        result.statBonus = attacker.stats?.get('strength') || 0;
        result.baseDamage = result.diceRoll + result.statBonus;

        result.defenseReduction = defender.stats?.get('defense') || 0;
        const finalDamage = Math.max(1, result.baseDamage - result.defenseReduction);

        this.eventManager.publish('damage_calculated', {
            ...data,
            damage: finalDamage,
            details: { ...result, finalDamage },
        });
    }
}
