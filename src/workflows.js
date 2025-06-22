// src/workflows.js

// === 몬스터 사망 워크플로우 ('코드 1') ===
export function monsterDeathWorkflow(context) {
    const { eventManager, victim, attacker } = context;

    // 1. "경험치 획득!" 이벤트를 방송한다.
    if (!victim.isFriendly && (attacker.isPlayer || attacker.isFriendly)) {
        const exp = victim.expValue;

        // 경험치는 StatEngine을 통해 일관적으로 처리하도록 이벤트만 발행한다.
        // applied 플래그를 넘기지 않아 항상 StatEngine이 적용한다.
        eventManager.publish('exp_gained', { entity: attacker, exp });
    }
    
    // 2. (미래를 위한 구멍) "아이템 드랍!" 이벤트를 방송한다.
    eventManager.publish('drop_loot', { position: { x: victim.x, y: victim.y }, monsterType: victim.constructor.name });
    
    // 3. 사망한 몬스터를 모든 매니저에서 확실하게 제거한다.
    eventManager.publish('entity_removed', { victimId: victim.id });
}

// === 무기 무장해제 워크플로우 ===
export function disarmWorkflow(context) {
    const { eventManager, owner, weapon, itemManager, equipmentManager, vfxManager } = context;

    if (equipmentManager && typeof equipmentManager.unequip === 'function') {
        equipmentManager.unequip(owner, 'weapon');
    }

    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 50;
    const endX = owner.x + Math.cos(angle) * distance;
    const endY = owner.y + Math.sin(angle) * distance;

    weapon.x = endX;
    weapon.y = endY;

    if (vfxManager) {
        vfxManager.addEjectAnimation(weapon, { x: owner.x, y: owner.y }, angle, distance);
    } else {
        itemManager.addItem(weapon);
    }

    setTimeout(() => {
        if (itemManager) itemManager.addItem(weapon);
    }, 350);

    eventManager.publish('log', {
        message: `💥 ${owner.constructor.name}의 ${weapon.name}(이)가 튕겨나갔습니다!`,
        color: 'orange'
    });
}

// === 방어구 파괴 워크플로우 ===
export function armorBreakWorkflow(context) {
    const { eventManager, owner, armor, equipmentManager, vfxManager } = context;

    if (equipmentManager && typeof equipmentManager.unequip === 'function') {
        equipmentManager.unequip(owner, 'armor');
    }

    if (vfxManager) {
        vfxManager.addArmorBreakAnimation(armor, owner);
    }

    eventManager.publish('log', {
        message: `🛡️ ${owner.constructor.name}의 ${armor.name}(이)가 파괴되었습니다!`,
        color: 'red'
    });
}
