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

            // 3. 태그에 의한 추가 데미지 (미래를 위한 구멍)
            const weapon = attacker.equipment.weapon;
            if (this.tagManager.hasTag(weapon, 'fire_stone') && this.tagManager.hasTag(skill, 'fire')) {
                details.fromTags = 5; // 화염석 보너스 +5
                finalDamage += details.fromTags;
            }
        }

        // 4. 방어력에 의한 피해 감소
        details.defenseReduction = defender.stats.get('defense');
        finalDamage = Math.max(1, finalDamage - details.defenseReduction);

        details.finalDamage = finalDamage;

        this.eventManager.publish('damage_calculated', { ...data, damage: finalDamage, details });
    }
}
