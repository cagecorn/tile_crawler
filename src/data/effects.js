export const EFFECTS = {
    // 버프
    strength_buff: {
        name: '힘의 축복',
        type: 'buff',
        duration: 300, // 300프레임 (약 5초)
        stats: { strength: 5 },
        tags: ['buff', 'stat_up'],
    },
    defense_buff: {
        name: '수비 태세',
        type: 'buff',
        duration: 300,
        stats: { defense: 5 },
        tags: ['buff', 'defense_up'],
    },
    magic_buff: {
        name: '비전 집중',
        type: 'buff',
        duration: 300,
        stats: { intelligence: 5 },
        tags: ['buff', 'magic_up'],
    },
    magic_resist_buff: {
        name: '마법 보호막',
        type: 'buff',
        duration: 300,
        stats: { magicResist: 5 },
        tags: ['buff', 'magic_resist_up'],
    },
    all_stat_buff: {
        name: '신의 가호',
        type: 'buff',
        duration: 300,
        stats: { strength: 2, agility: 2, endurance: 2, intelligence: 2 },
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
    attack_down: {
        name: '공격 약화',
        type: 'debuff',
        duration: 300,
        stats: { attackPower: -5 },
        tags: ['debuff', 'attack_down'],
    },
    magic_down: {
        name: '마법 약화',
        type: 'debuff',
        duration: 300,
        stats: { intelligence: -5 },
        tags: ['debuff', 'magic_down'],
    },
    magic_resist_down: {
        name: '저항 약화',
        type: 'debuff',
        duration: 300,
        stats: { magicResist: -5 },
        tags: ['debuff', 'magic_resist_down'],
    },
    resist_down: {
        name: '모든 저항 약화',
        type: 'debuff',
        duration: 300,
        stats: { elementalResist: -5 },
        tags: ['debuff', 'resist_down'],
    },
    // 상태이상
    poison: {
        name: '중독',
        type: 'dot', // Damage over Time
        duration: 500, // 5턴 (100프레임당 1턴 기준)
        damagePerTurn: 2,
        tags: ['status_ailment', 'poison'],
        iconKey: 'parasite',
    },

    shield: {
        name: '보호막',
        type: 'shield',
        duration: 300,
        shieldAmount: 10,
        tags: ['buff', 'shield'],
        iconKey: 'guardian-hymn-effect',
    },

    bonus_damage: {
        name: '공격력 증가',
        type: 'damage_buff',
        duration: 300,
        bonusDamage: 2,
        tags: ['buff', 'attack_up'],
        iconKey: 'courage-hymn-effect',
    },

    slow: {
        name: '감속',
        type: 'debuff',
        duration: 300,
        stats: { movementSpeed: -1 },
        tags: ['debuff', 'slow'],
    },

    charging_shot_effect: {
        name: '충전된 사격',
        type: 'buff',
        duration: 120,
        stats: {},
        tags: ['buff', 'attack_up', 'charge_shot'],
        iconKey: 'courage-hymn-effect',
    },

    parry_ready: {
        name: '패링 준비',
        type: 'buff',
        duration: 60,
        stats: {},
        tags: ['buff', 'parry_ready']
    }
};
