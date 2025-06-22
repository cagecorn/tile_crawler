import { describe, test, assert } from './helpers.js';
import { StatManager } from '../src/stats.js';

describe('Emotion Card', () => {
  test('bonus applies when matching state active', () => {
    const entity = { effects: [], equipment: {}, emotionSlots: { IE:null,SN:null,TF:null,JP:null } };
    entity.stats = new StatManager(entity, { strength: 1, endurance: 1 });
    // baseline attack power
    entity.stats.recalculate();
    const base = entity.stats.get('attackPower');
    // add state effect
    entity.effects.push({ id: 'state_P' });
    // equip card
    const card = { type:'emotion_card', slot:'JP', alphabet:'P', stateBonus:{ attackPower: 2 }, stats:{} };
    entity.emotionSlots.JP = card;
    entity.stats.updateEquipmentStats();
    entity.stats.recalculate();
    assert.strictEqual(entity.stats.get('attackPower'), base + 2);
  });
});
