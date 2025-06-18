export class CombatCalculator {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    // 공격 이벤트를 처리하여 피해량을 계산한 뒤 이벤트로 발행한다.
    handleAttack(data) {
        const { attacker, defender } = data;
        const baseDamage = data.damage !== undefined ? data.damage : attacker.attackPower;

        this.eventManager.publish('damage_calculated', { ...data, damage: baseDamage });
    }
}
