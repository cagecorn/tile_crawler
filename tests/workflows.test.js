import { monsterDeathWorkflow } from '../src/workflows.js';
import { EventManager } from '../src/managers/eventManager.js';

console.log("--- Running Workflow Tests ---");

try {
    // 1. 테스트 환경 설정
    const eventManager = new EventManager();
    
    // 테스트 결과를 기록할 변수들
    let deathEventFired = false;
    let expEventFired = false;
    let lootEventFired = false;
    let removedEventFired = false;
    let gainedExp = 0;

    // 2. 가짜(mock) 데이터 생성
    const mockAttacker = { 
        isPlayer: true, 
        isFriendly: true,
        stats: { 
            addExp: (exp) => { gainedExp = exp; }
        } 
    };
    const mockVictim = { 
        id: 'monster-123',
        expValue: 50,
        x: 100, y: 100,
        constructor: { name: 'Monster' }
    };
    const context = {
        eventManager,
        attacker: mockAttacker,
        victim: mockVictim,
    };

    // 3. 워크플로우 실행 전에 이벤트 구독
    eventManager.subscribe('entity_death', () => { deathEventFired = true; });
    eventManager.subscribe('exp_gained', (data) => { expEventFired = true; });
    eventManager.subscribe('drop_loot', () => { lootEventFired = true; });
    eventManager.subscribe('entity_removed', (data) => {
        if(data.victimId === 'monster-123') {
            removedEventFired = true;
        }
    });
    
    // 4. 워크플로우 실행!
    monsterDeathWorkflow(context);

    // 5. 결과 확인
    if (!deathEventFired) throw new Error("사망(entity_death) 이벤트가 발생하지 않음");
    if (!expEventFired) throw new Error("경험치 획득(exp_gained) 이벤트가 발생하지 않음");
    if (!lootEventFired) throw new Error("아이템 드랍(drop_loot) 이벤트가 발생하지 않음");
    if (!removedEventFired) throw new Error("개체 제거(entity_removed) 이벤트가 발생하지 않음");
    if (gainedExp !== 50) throw new Error(`획득 경험치가 50이 아님 (실제: ${gainedExp})`);

    console.log("✅ PASSED: 몬스터 사망 워크플로우");

} catch (e) {
    console.error(`❌ FAILED: 몬스터 사망 워크플로우 - ${e.message}`);
}
