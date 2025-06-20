export const ITEMS = {
    // 무기
    short_sword: {
        name: '단검',
        type: 'weapon',
        damageDice: '1d6',
        tags: ['melee', 'sword'],
        imageKey: 'sword',
        stats: { attackPower: 2 },
        tier: 'normal',
        durability: 100,
        weight: 10,
        toughness: 5,
    },
    long_bow: {
        name: '장궁',
        type: 'weapon',
        damageDice: '1d6',
        tags: ['ranged', 'bow', 'finesse_weapon'],
        imageKey: 'bow',
        stats: { attackPower: 2, attackRange: 384 },
        tier: 'normal',
        durability: 80,
        weight: 8,
        toughness: 3,
    },

    violin_bow: {
        name: '바이올린 보우',
        type: 'weapon',
        damageDice: '1d6',
        tags: ['ranged', 'bow', 'finesse_weapon', 'song'],
        imageKey: 'violin-bow',
        stats: { attackPower: 2, attackRange: 384 },
        tier: 'normal',
        durability: 70,
        weight: 7,
        toughness: 3,
    },

    plate_armor: {
        name: '강철 갑옷',
        type: 'armor',
        tags: ['armor', 'heavy_armor'],
        imageKey: 'plate-armor',
        stats: { maxHp: 10 },
        tier: 'rare',
        durability: 200,
        weight: 15,
        toughness: 12,
    },

    // 방어구
    leather_armor: {
        name: '가죽 갑옷',
        type: 'armor',
        tags: ['armor', 'light_armor'],
        imageKey: 'leather_armor',
        stats: { maxHp: 5 },
        tier: 'normal',
        durability: 60,
        weight: 5,
        toughness: 4,
    },

    // 기본 소모품 및 화폐
    potion: {
        name: '힐링 포션',
        type: 'consumable',
        tags: ['consumable', 'healing_item', '체력 회복 아이템'],
        imageKey: 'potion',
        healAmount: 5,
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
        tier: 'normal',
        durability: 90,
        weight: 9,
        toughness: 5,
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
    pet_fox: {
        name: 'Fox Pet',
        type: 'pet',
        tags: ['pet'],
        imageKey: 'pet-fox',
        cooldown: 600,
    },
    pet_food: {
        name: 'Pet Food',
        type: 'consumable',
        tags: ['pet_food'],
        imageKey: 'potion',
    },
    // 버프 아이템
    strength_elixir: {
        name: '힘의 비약',
        type: 'consumable',
        tags: ['consumable', 'buff_item'],
        imageKey: 'potion',
        effectId: 'strength_buff'
    },
};
