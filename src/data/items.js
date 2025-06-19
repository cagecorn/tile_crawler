export const ITEMS = {
    // 무기
    short_sword: {
        name: '단검',
        type: 'weapon',
        damageDice: '1d6',
        tags: ['melee', 'sword'],
        imageKey: 'sword',
        stats: { attackPower: 2 },
    },
    long_bow: {
        name: '장궁',
        type: 'weapon',
        damageDice: '1d6',
        tags: ['ranged', 'bow'],
        imageKey: 'bow',
        stats: { attackPower: 2, attackRange: 384 },
    },

    // 방어구
    leather_armor: {
        name: '가죽 갑옷',
        type: 'armor',
        tags: ['armor', 'light_armor'],
        imageKey: 'leather_armor',
        stats: { maxHp: 5 },
    },
};
