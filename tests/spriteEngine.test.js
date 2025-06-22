import { SpriteEngine } from '../src/engines/spriteEngine.js';
import { EventManager } from '../src/managers/eventManager.js';
import { describe, test, assert } from './helpers.js';

describe('SpriteEngine', () => {
  test('play_sprite_animation triggers sequential frames', () => {
    const em = new EventManager();
    const frames = ['a', 'b'];
    const calls = [];
    const vfx = { addSpriteEffect: img => calls.push(img) };
    const engine = new SpriteEngine(em, vfx);
    em.publish('play_sprite_animation', { frames, x:0, y:0, frameDuration:1 });
    engine.update();
    assert.strictEqual(calls[0], 'a');
    engine.update();
    assert.strictEqual(calls[1], 'b');
  });
});
