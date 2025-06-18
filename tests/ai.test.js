import { MeleeAI } from '../src/ai.js';
import { test, assert } from './helpers.js';

console.log("--- Running AI Tests ---");

const mapStub = { tileSize: 1, isWallAt: () => false };

// 공격 범위 내 적을 공격하는지 확인

test('MeleeAI - 공격 결정', () => {
    const ai = new MeleeAI();
    const self = { x: 0, y: 0, visionRange: 100, attackRange: 10, speed: 5, tileSize: 1 };
    const context = { player: {}, allies: [], enemies: [{ x: 5, y: 0 }], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'attack');
});

// 사정거리 밖의 적에게 이동 명령을 내리는지 확인

test('MeleeAI - 이동 결정', () => {
    const ai = new MeleeAI();
    const self = { x: 0, y: 0, visionRange: 100, attackRange: 10, speed: 5, tileSize: 1 };
    const context = { player: {}, allies: [], enemies: [{ x: 20, y: 0 }], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'move');
});

// 아군이 플레이어를 따라가는지 확인

test('MeleeAI - 플레이어 추적', () => {
    const ai = new MeleeAI();
    const self = { x: 0, y: 0, visionRange: 100, attackRange: 10, speed: 5, tileSize: 1, isFriendly: true, isPlayer: false };
    const player = { x: 10, y: 0 };
    const context = { player, allies: [], enemies: [], mapManager: mapStub };
    const action = ai.decideAction(self, context);
    assert.strictEqual(action.type, 'move');
    assert.strictEqual(action.target, player);
});
