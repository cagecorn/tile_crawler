import { PathfindingManager } from '../src/managers/pathfindingManager.js';
import { test, assert } from './helpers.js';

console.log("--- Running PathfindingManager Tests ---");

test('생성', () => {
    const pfManager = new PathfindingManager(null);
    assert.ok(pfManager);
});

test('단순 경로 탐색', () => {
    const mapManager = {
        map: [
            [0,0,0],
            [0,0,0],
            [0,0,0]
        ],
        width: 3,
        height:3,
        tileSize:1,
        tileTypes: { FLOOR:0, WALL:1 },
        isWallAt(x,y){
            const tx = Math.floor(x/1); const ty=Math.floor(y/1);
            return this.map[ty][tx]===this.tileTypes.WALL;
        }
    };
    const pfManager = new PathfindingManager(mapManager);
    const path = pfManager.findPath(0,0,2,0);
    assert.deepStrictEqual(path, [{x:1,y:0},{x:2,y:0}]);
});

test('동적 장애물 회피', () => {
    const mapManager = {
        map: [
            [0,0,0],
            [0,0,0],
            [0,0,0]
        ],
        width:3,
        height:3,
        tileSize:1,
        tileTypes:{FLOOR:0,WALL:1},
        isWallAt(x,y){
            const tx=Math.floor(x/1); const ty=Math.floor(y/1);
            return this.map[ty][tx]===this.tileTypes.WALL;
        }
    };
    const pfManager = new PathfindingManager(mapManager);
    const blocker = (x,y)=> (x===1 && y===0);
    const path = pfManager.findPath(0,0,2,0,blocker);
    assert.deepStrictEqual(path, [
        {x:0,y:1},
        {x:1,y:1},
        {x:2,y:1},
        {x:2,y:0}
    ]);
});
