// src/micro/WeaponAI.js

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

// 검 AI: 일반적인 근접 전투 수행 및 패링 기회 탐색
export class SwordAI extends BaseWeaponAI {
    decideAction(wielder, weapon, context) {
        // TODO: MeleeAI와 유사한 타겟팅 로직 + 패링 스킬 사용 조건 확인
        return { type: 'idle' }; // 임시
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
        // TODO: RangedAI와 유사한 카이팅 로직 + 충전 후 발사 스킬 사용
        return { type: 'idle' };
    }
}

// 창 AI: 긴 사거리를 이용한 카이팅 및 돌진
export class SpearAI extends BaseWeaponAI {
    decideAction(wielder, weapon, context) {
        // TODO: 적과 일정 거리를 유지하며 공격하고, 돌진 스킬 기회 탐색
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
        // TODO: 빠른 속도로 접근해 공격 후, 즉시 뒤로 빠지는 로직 구현
        return { type: 'idle' };
    }
}

export { BaseWeaponAI };
