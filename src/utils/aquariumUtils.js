// src/utils/aquariumUtils.js
// Utility functions for the Aquarium map

/**
 * Adjusts base stats so monsters have zero attack power and double health.
 * @param {object} baseStats
 * @returns {object} adjusted copy of baseStats
 */
export function adjustMonsterStatsForAquarium(baseStats = {}) {
    const strength = baseStats.strength ?? 1;
    const endurance = baseStats.endurance ?? 1;
    const adjusted = { ...baseStats };

    // attackPower formula in StatManager: baseAP + 1 + strength * 2
    adjusted.attackPower = -1 - strength * 2;

    // For maxHp = 10 + endurance * 5. We want double the original value.
    adjusted.endurance = 2 + 2 * endurance;

    return adjusted;
}
