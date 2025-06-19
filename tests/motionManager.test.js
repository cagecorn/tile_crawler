import { PathfindingManager } from '../src/managers/pathfindingManager.js';
import { MotionManager } from '../src/managers/motionManager.js';
import { describe, test, assert } from './helpers.js';

describe('Managers', () => {

test('dashTowards 이동 거리 제한', () => {
    const mapManager = {
        tileSize: 1,
        width: 5,
        height: 5,
        tileTypes: { FLOOR: 0, WALL: 1 },
        map: Array.from({ length: 5 }, () => Array(5).fill(0)),
        isWallAt: () => false,
    };
    const pathManager = new PathfindingManager(mapManager);
    const motion = new MotionManager(mapManager, pathManager);
    const entity = { x: 0, y: 0, width: 1, height: 1 };
    const target = { x: 4, y: 0 };
    motion.dashTowards(entity, target, 3);
    assert.strictEqual(entity.x, 3);
    assert.strictEqual(entity.y, 0);
});

});
