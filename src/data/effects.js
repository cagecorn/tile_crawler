export const EFFECTS = {
    // 버프
    strength_buff: {
        name: '힘의 축복',
        type: 'buff',
        duration: 300, // 300프레임 (약 5초)
        stats: { strength: 5 },
        tags: ['buff', 'stat_up'],
    },
    // 디버프
    armor_break: {
        name: '방어구 부수기',
        type: 'debuff',
        duration: 300,
        stats: { defense: -10 },
        tags: ['debuff', 'stat_down'],
    },
    // 상태이상
    poison: {
        name: '중독',
        type: 'dot', // Damage over Time
        duration: 500, // 5턴 (100프레임당 1턴 기준)
        damagePerTurn: 2,
        tags: ['status_ailment', 'poison'],
    }
};
