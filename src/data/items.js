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
        tags: ['ranged', 'bow', 'finesse_weapon'],
        imageKey: 'bow',
        stats: { attackPower: 2, attackRange: 384 },
    },

    violin_bow: {
        name: '바이올린 보우',
        type: 'weapon',
        damageDice: '1d6',
        tags: ['ranged', 'bow', 'finesse_weapon', 'song'],
        imageKey: 'violin-bow',
        stats: { attackPower: 2, attackRange: 384 },
    },

    plate_armor: {
        name: '강철 갑옷',
        type: 'armor',
        tags: ['armor', 'heavy_armor'],
        imageKey: 'plate-armor',
        stats: { maxHp: 10 },
    },

    // 방어구
    leather_armor: {
        name: '가죽 갑옷',
        type: 'armor',
        tags: ['armor', 'light_armor'],
        imageKey: 'leather_armor',
        stats: { maxHp: 5 },
    },

    // 기본 소모품 및 화폐
    potion: {
        name: '힐링 포션',
        type: 'consumable',
        tags: ['consumable', 'healing_item', '체력 회복 아이템'],
        imageKey: 'potion',
        range: 192,
    },
    gold: {
        name: 'gold',
        type: 'currency',
        tags: ['currency'],
        imageKey: 'gold',
    },

    // 일반적인 검 아이템 (드랍 테이블용)
    sword: {
        name: '검',
        type: 'weapon',
        damageDice: '1d6',
        tags: ['melee', 'sword'],
        imageKey: 'sword',
        stats: { attackPower: 2 },
    },

    // Parasite samples
    parasite_leech: {
        name: 'Leech',
        type: 'parasite',
        tags: ['parasite'],
        imageKey: 'leech',
        stats: { endurance: 1 },
    },
    parasite_worm: {
        name: 'Mind Worm',
        type: 'parasite',
        tags: ['parasite'],
        imageKey: 'worm',
        stats: { intelligence: 1 },
    },
};
