export class CombatCalculator {
    constructor(eventManager, tagManager) {
        this.eventManager = eventManager;
        this.tagManager = tagManager;
    }

    handleAttack(data) {
        const { attacker, defender, skill } = data;

        let finalDamage = 0;
        const details = { base: 0, fromSkill: 0, fromTags: 0, defenseReduction: 0 };

        // 1. 기본 공격력 계산 (힘 기반)
        details.base = attacker.attackPower;
        finalDamage += details.base;

        // 2. 스킬에 의한 데미지 계산
        if (skill) {
            if (this.tagManager.hasTag(skill, 'physical')) {
                // 물리 스킬은 공격력 계수
                details.fromSkill = (attacker.attackPower * (skill.damageMultiplier || 1)) - attacker.attackPower;
            } else if (this.tagManager.hasTag(skill, 'magic')) {
                // 마법 스킬은 지능 계수 (나중에 추가) + 기본 데미지
                details.fromSkill = skill.damage || 0;
            }
            finalDamage += details.fromSkill;

            // 3. 태그 조합에 따른 추가 데미지
            const bonus = this.tagManager.calculateDamageBonus(attacker, skill);
            details.fromTags = bonus;
            finalDamage += bonus;
        }

        // 4. 방어력에 의한 피해 감소
        details.defenseReduction = defender.stats.get('defense');
        finalDamage = Math.max(1, finalDamage - details.defenseReduction);

        details.finalDamage = finalDamage;

        // 공격 판정이 성공적으로 끝났음을 미시 세계에 알린다
        this.eventManager.publish('attack_landed', { attacker, defender, skill });

        this.eventManager.publish('damage_calculated', { ...data, damage: finalDamage, details });
    }
}
