// src/data/tables.js

// 몬스터 등장 확률 테이블
export const MONSTER_SPAWN_TABLE = [
    { id: 'normal_monster', weight: 80 }, // 일반 몬스터 등장 가중치: 80
    { id: 'epic_monster', weight: 20 },   // 에픽 몬스터 등장 가중치: 20
];

// 아이템 드랍 확률 테이블 (미래를 위한 구멍)
export const LOOT_DROP_TABLE = [
    { id: 'gold', weight: 70 },
    { id: 'potion', weight: 25 },
    { id: 'sword', weight: 5 },
];
