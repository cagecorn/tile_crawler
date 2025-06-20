import { WEAPON_SKILLS } from './data/weapon-skills.js';

export class CombatCalculator {
    constructor(eventManager, tagManager) {
        this.eventManager = eventManager;
        this.tagManager = tagManager;
    }

    handleAttack(data) {
        const { attacker, defender, skill } = data;

        // --- 패링 로직 시작 ---
        const defendingWeapon = defender.equipment?.weapon;

        const parryReadyIndex = defender.effects?.findIndex(e => e.id === 'parry_ready');
        if (parryReadyIndex >= 0 && defendingWeapon) {
            this.eventManager.publish('log', {
                message: `⚔️ ${defender.constructor.name}이 패링으로 공격을 막아냅니다!`,
                color: 'cyan'
            });
            this.eventManager.publish('parry_success', { attacker, defender });
            defender.effects.splice(parryReadyIndex, 1);
            const cooldown = WEAPON_SKILLS.parry.cooldown;
            defendingWeapon.weaponStats.setCooldown(cooldown);
            return;
        }

        if (defendingWeapon && defendingWeapon.weaponStats?.canUseSkill('parry')) {
            const parrySkillData = WEAPON_SKILLS.parry;
            if (Math.random() < parrySkillData.procChance) {
                this.eventManager.publish('log', {
                    message: `⚔️ ${defender.constructor.name}의 ${defendingWeapon.name}(이)가 ${attacker.constructor.name}의 공격을 쳐냈습니다! [패링]`,
                    color: 'cyan'
                });
                this.eventManager.publish('parry_success', { attacker, defender });
                defendingWeapon.weaponStats.setCooldown(parrySkillData.cooldown);
                return;
            }
        }
        // --- 패링 로직 끝 ---

        let finalDamage = 0;
        const details = { base: 0, fromSkill: 0, fromTags: 0, defenseReduction: 0 };

        const chargeEffect = attacker.effects?.find(e => e.id === 'charging_shot_effect');
        let damageMultiplier = 1.0;
        if (chargeEffect) {
            damageMultiplier = 1.5;
            attacker.effects = attacker.effects.filter(e => e.id !== 'charging_shot_effect');
            this.eventManager.publish('log', { message: `[충전된 사격]이 발동됩니다!`, color: 'magenta' });
        }

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
        finalDamage *= damageMultiplier;
        finalDamage = Math.floor(finalDamage);

        details.finalDamage = finalDamage;

        // 공격 판정이 성공적으로 끝났음을 미시 세계에 알린다
        this.eventManager.publish('attack_landed', { attacker, defender, skill });

        this.eventManager.publish('damage_calculated', { ...data, damage: finalDamage, details });
    }
}
