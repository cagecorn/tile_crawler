// src/utils/random.js

/**
 * 가중치 테이블로부터 하나의 결과를 무작위로 선택합니다.
 * @param {Array<{id: string, weight: number}>} table - 가중치를 포함하는 객체 배열
 * @returns {string|null} - 선택된 아이템의 id
 */
export function rollOnTable(table) {
    // 1. 모든 가중치의 합을 구합니다.
    const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
    
    // 2. 0부터 가중치 총합 사이의 무작위 숫자를 뽑습니다.
    let randomRoll = Math.random() * totalWeight;

    // 3. 테이블을 순회하며, 무작위 숫자가 어느 구간에 속하는지 확인합니다.
    for (const entry of table) {
        if (randomRoll < entry.weight) {
            return entry.id; // 당첨!
        }
        randomRoll -= entry.weight;
    }

    return null; // 혹시 모를 오류 방지
}
