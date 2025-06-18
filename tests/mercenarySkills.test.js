import { CharacterFactory } from '../src/factory.js';
import { test, assert } from './helpers.js';
import { SKILLS } from '../src/data/skills.js';

console.log("--- Running Mercenary Skill Tests ---");

const assets = { mercenary:{} };

function createMercWithRandom(randomValue) {
    const original = Math.random;
    Math.random = () => randomValue;
    const factory = new CharacterFactory(assets);
    const merc = factory.create('mercenary', { x:0, y:0, tileSize:1, groupId:'g', jobId:'warrior', image:null });
    Math.random = original;
    return merc;
}

test('무작위 스킬 부여 - double_strike', () => {
    const merc = createMercWithRandom(0.1);
    assert.strictEqual(merc.skills[0], SKILLS.double_strike.id);
});

test('무작위 스킬 부여 - charge_attack', () => {
    const merc = createMercWithRandom(0.9);
    assert.strictEqual(merc.skills[0], SKILLS.charge_attack.id);
});
