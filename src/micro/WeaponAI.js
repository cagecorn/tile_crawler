class BaseWeaponAI {
    decideAction(wielder, weapon, context) {
        return { type: 'idle' };
    }
}

export class SwordAI extends BaseWeaponAI {
    decideAction(wielder, weapon, context) {
        return { type: 'attack', target: context.enemies[0] };
    }
}

export class BowAI extends BaseWeaponAI {
    decideAction(wielder, weapon, context) {
        if (context.enemies[0]) {
            return { type: 'attack', target: context.enemies[0] };
        }
        return { type: 'idle' };
    }
}

export class SpearAI extends BaseWeaponAI {}
export class SaberAI extends BaseWeaponAI {}

export { BaseWeaponAI };
