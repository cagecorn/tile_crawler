export class MicroItemAIManager {
    getWeaponAI(weapon) {
        return weapon?.weaponStats?.getAI() || null;
    }
}
