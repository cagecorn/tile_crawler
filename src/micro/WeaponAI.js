// src/micro/WeaponAI.js
import { WEAPON_SKILLS } from '../data/weapon-skills.js';

// 모든 무기 AI의 기반이 될 부모 클래스입니다.
class BaseWeaponAI {
    /**
     * @param {Entity} wielder - 무기를 사용하는 유닛
     * @param {Item} weapon - 행동을 결정하는 무기 자신
     * @param {object} context - 주변 상황 정보
     * @returns {object} - 행동 객체 (e.g., { type: 'attack', target: ... })
     */
    decideAction(wielder, weapon, context) {
        // 이 메서드는 각 무기 AI 클래스에서 재정의됩니다.
        return { type: 'idle' };
    }
}

// 검 AI: 일반적인 근접 전투 수행 및 패링 자세 사용
export class SwordAI extends BaseWeaponAI {
    decideAction(wielder, weapon, context) {
        const { enemies } = context;
        if (!enemies || enemies.length === 0) return { type: 'idle' };

        let nearest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const d = Math.hypot(enemy.x - wielder.x, enemy.y - wielder.y);
            if (d < minDist) {
                minDist = d;
                nearest = enemy;
            }
        }

        if (!nearest) return { type: 'idle' };

        if (
            weapon?.weaponStats?.canUseSkill('parry_stance') &&
            minDist <= wielder.attackRange &&
            wielder.attackCooldown > 0
        ) {
            return { type: 'weapon_skill', skillId: 'parry_stance', target: wielder };
        }

        if (minDist <= wielder.attackRange) {
            return { type: 'attack', target: nearest };
        }

        return { type: 'move', target: nearest };
    }
}

// 단검 AI: 적의 배후를 노리는 움직임 추가
export class DaggerAI extends BaseWeaponAI {
    decideAction(wielder, weapon, context) {
        // TODO: 적의 뒤로 이동하려는 시도 후 백스탭 스킬 사용
        return { type: 'idle' };
    }
}

// 활 AI: 거리를 유지하며 충전 사격 기회 탐색
export class BowAI extends BaseWeaponAI {
    decideAction(wielder, weapon, context) {
        const { enemies } = context;
        if (!enemies || enemies.length === 0) return { type: 'idle' };

        const nearestTarget = enemies.sort((a,b)=>Math.hypot(a.x-wielder.x,a.y-wielder.y)-Math.hypot(b.x-wielder.x,b.y-wielder.y))[0];
        const distance = Math.hypot(nearestTarget.x-wielder.x, nearestTarget.y-wielder.y);

        const isCharging = wielder.effects?.some(e=>e.id==='charging_shot_effect');
        if (isCharging) {
            return { type: 'attack', target: nearestTarget };
        }

        const chargeSkillId = 'charge_shot';
        if (weapon.weaponStats?.canUseSkill(chargeSkillId) && distance <= wielder.attackRange && distance > wielder.attackRange*0.5) {
            return { type: 'weapon_skill', skillId: chargeSkillId, target: wielder };
        }

        if (distance <= wielder.attackRange*0.5) {
            return { type: 'move', target: { x: wielder.x - (nearestTarget.x - wielder.x), y: wielder.y - (nearestTarget.y - wielder.y) } };
        } else if (distance > wielder.attackRange) {
            return { type: 'move', target: nearestTarget };
        }

        return { type: 'attack', target: nearestTarget };
    }
}

// 창 AI: 긴 사거리를 이용한 카이팅 및 돌진
export class SpearAI extends BaseWeaponAI {
    decideAction(wielder, weapon, context) {
        const { enemies, mapManager } = context;
        if (!enemies || enemies.length === 0) return { type: 'idle' };

        let nearestTarget = null;
        let minDistance = Infinity;
        for (const target of enemies) {
            const d = Math.hypot(target.x-wielder.x, target.y-wielder.y);
            if (d < minDistance) { minDistance = d; nearestTarget = target; }
        }

        if (nearestTarget) {
            const chargeSkillId = 'charge';
            const chargeData = WEAPON_SKILLS[chargeSkillId];
            const chargeRange = chargeData.range || 200;

            if (weapon.weaponStats?.canUseSkill(chargeSkillId) && minDistance > wielder.attackRange && minDistance <= chargeRange) {
                return { type: 'weapon_skill', skillId: chargeSkillId, target: nearestTarget };
            }

            if (minDistance <= wielder.attackRange) {
                return { type: 'attack', target: nearestTarget };
            }

            return { type: 'move', target: nearestTarget };
        }

        return { type: 'idle' };
    }
}

// 바이올린 활 AI: 원거리 공격 및 특수 음파 화살 사용
export class ViolinBowAI extends BowAI {
    decideAction(wielder, weapon, context) {
        // TODO: 기본 활 AI 로직 + 음파 화살 스킬 사용
        return super.decideAction(wielder, weapon, context);
    }
}

// 에스톡 AI: 히트 앤 런 전술 구사
export class EstocAI extends BaseWeaponAI {
    decideAction(wielder, weapon, context) {
        const { enemies } = context;
        if (!enemies || enemies.length === 0) {
            wielder.aiState = null;
            return { type: 'idle' };
        }

        const nearestTarget = enemies.sort((a, b) => Math.hypot(a.x - wielder.x, a.y - wielder.y) - Math.hypot(b.x - wielder.x, b.y - wielder.y))[0];
        const distance = Math.hypot(nearestTarget.x - wielder.x, nearestTarget.y - wielder.y);

        if (wielder.aiState === 'retreating') {
            if (wielder.aiStateTimer > 0) {
                wielder.aiStateTimer--;
                const retreatTarget = {
                    x: wielder.x - (nearestTarget.x - wielder.x),
                    y: wielder.y - (nearestTarget.y - wielder.y)
                };
                return { type: 'move', target: retreatTarget };
            }
            wielder.aiState = null;
        }

        if (distance <= wielder.attackRange) {
            wielder.aiState = 'retreating';
            wielder.aiStateTimer = 30;
            return { type: 'attack', target: nearestTarget };
        }

        return { type: 'move', target: nearestTarget };
    }
}

export class SaberAI extends EstocAI {}

// --- 신규 무기 AI 클래스 ---
export class AxeAI extends SwordAI {}
export class MaceAI extends SwordAI {}

// 지팡이 AI: 원거리 마법 공격
export class StaffAI extends BowAI {
    // TODO: 지능 기반 데미지 계산 로직과 연계 필요
}

// 낫, 채찍 AI: 창과 같은 중거리 유지 AI
export class ScytheAI extends SpearAI {}
export class WhipAI extends SpearAI {}
// --- 여기까지 ---

export { BaseWeaponAI };
