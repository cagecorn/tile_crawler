export class CombatCalculator {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    // 공격 이벤트를 처리하여 피해량을 계산한 뒤 이벤트로 발행한다.
    handleAttack(data) {
        const { attacker, defender } = data;
        const damage = attacker.attackPower; // 지금은 간단한 계산

        // 계산된 피해량을 포함하여 이벤트를 발행한다.
        this.eventManager.publish('damage_calculated', { ...data, damage });
    }
}
