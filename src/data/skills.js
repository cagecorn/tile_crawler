export const SKILLS = {
    power_strike: {
        id: 'power_strike',
        name: '강타',
        description: '적에게 일반 공격보다 강력한 피해를 입힙니다.',
        manaCost: 10,
        cooldown: 120,
        damageMultiplier: 2.5,
        damageDice: '1d8+2',
        icon: 'assets/images/fire-nova-effect.png',
        tags: ['skill', 'attack', 'melee', 'single_target'],
    },
    fireball: {
        id: 'fireball',
        name: '파이어볼',
        description: '화염 구체를 날려 적에게 피해를 입힙니다.',
        manaCost: 15,
        cooldown: 90,
        damage: 10,
        damageDice: '1d10+3',
        projectile: 'fireball',
        tags: ['skill', 'attack', 'magic', 'ranged', 'fire'],
    },
};
