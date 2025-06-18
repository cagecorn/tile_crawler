// src/workflows.js

// === 몬스터 사망 워크플로우 ('코드 1') ===
export function monsterDeathWorkflow(context) {
    const { eventManager, victim, attacker } = context;

    // 1. "몬스터 사망!" 이벤트를 방송한다.
    eventManager.publish('entity_death', { victim, attacker });

    // 2. "경험치 획득!" 이벤트를 방송한다.
    if (!victim.isFriendly && (attacker.isPlayer || attacker.isFriendly)) {
        const exp = victim.expValue;

        // 실제 경험치를 즉시 적용하여 테스트에서도 검증 가능하도록 한다.
        if (attacker.stats && typeof attacker.stats.addExp === 'function') {
            attacker.stats.addExp(exp);
        }

        eventManager.publish('exp_gained', { player: attacker, exp });
    }
    
    // 3. (미래를 위한 구멍) "아이템 드랍!" 이벤트를 방송한다.
    eventManager.publish('drop_loot', { position: { x: victim.x, y: victim.y }, monsterType: victim.constructor.name });
    
    // 4. 사망한 몬스터를 모든 매니저에서 확실하게 제거한다.
    eventManager.publish('entity_removed', { victimId: victim.id });
}
