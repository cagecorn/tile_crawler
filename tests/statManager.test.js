// tests/statManager.test.js

// 테스트할 대상인 StatManager를 불러옵니다.
import { StatManager } from '../src/stats.js';

// 테스트를 위한 간단한 'assertion' 함수 (A와 B가 같은지 확인)
function assertEquals(a, b, message) {
    if (a !== b) {
        throw new Error(`Assertion failed: ${message}. Expected ${b}, but got ${a}.`);
    }
}

// --- StatManager 테스트 스위트 ---
console.log("--- Running StatManager Tests ---");

// 테스트 1: 초기 스탯이 올바르게 설정되는가?
try {
    const jobConfig = { strength: 5, endurance: 10 };
    const stats = new StatManager({}, jobConfig);
    assertEquals(stats.get('strength'), 5, "초기 힘 스탯");
    assertEquals(stats.get('endurance'), 10, "초기 체력 스탯");
    console.log("✅ PASSED: 초기 스탯 설정");
} catch (e) {
    console.error(`❌ FAILED: 초기 스탯 설정 - ${e.message}`);
}

// 테스트 2: 파생 스탯(maxHp, attackPower)이 올바르게 계산되는가?
try {
    const jobConfig = { strength: 5, endurance: 10 };
    const stats = new StatManager({}, jobConfig);
    // maxHp = 10 + endurance * 5  => 10 + 10 * 5 = 60
    assertEquals(stats.get('maxHp'), 60, "최대 HP 계산");
    // attackPower = 1 + strength * 2 => 1 + 5 * 2 = 11
    assertEquals(stats.get('attackPower'), 11, "공격력 계산");
    console.log("✅ PASSED: 파생 스탯 계산");
} catch (e) {
    console.error(`❌ FAILED: 파생 스탯 계산 - ${e.message}`);
}

// 테스트 3: 스탯 포인트 분배가 올바르게 작동하는가?
try {
    const jobConfig = { strength: 5, endurance: 10 };
    const stats = new StatManager({}, jobConfig);
    
    stats.allocatePoint('strength'); // 힘 1포인트 투자
    stats.recalculate();

    assertEquals(stats.get('strength'), 6, "힘 포인트 투자 후 스탯");
    assertEquals(stats.get('attackPower'), 13, "힘 포인트 투자 후 공격력 재계산");
    console.log("✅ PASSED: 스탯 포인트 분배");
} catch (e) {
    console.error(`❌ FAILED: 스탯 포인트 분배 - ${e.message}`);
}

console.log("--- StatManager Tests Finished ---");

