import { findEntitiesInRadius } from '../utils/entityUtils.js';

export class MotionManager {
    constructor(mapManager, pathfindingManager) {
        this.mapManager = mapManager;
        this.pathfindingManager = pathfindingManager;
        console.log("[MotionManager] Initialized");
    }

    // dash the entity toward the target up to maxTiles tiles
    dashTowards(entity, target, maxTiles = 8, allEnemies = [], eventManager = null, vfxManager = null, strikeImage = null) {
        const tileSize = this.mapManager.tileSize;
        const startPos = { x: entity.x, y: entity.y };

        const startX = Math.floor(entity.x / tileSize);
        const startY = Math.floor(entity.y / tileSize);
        const endX = Math.floor(target.x / tileSize);
        const endY = Math.floor(target.y / tileSize);

        const path = this.pathfindingManager.findPath(startX, startY, endX, endY, () => false);
        if (path.length === 0) return;

        const actualMoveDistance = Math.min(maxTiles, path.length);
        const dest = path[actualMoveDistance - 1];
        const destX = dest.x * tileSize;
        const destY = dest.y * tileSize;

        if (vfxManager) {
            vfxManager.createDashTrail(startPos.x, startPos.y, destX, destY, { color: 'rgba(255,255,255,0.7)', lifespan: 25 });
        }

        const hitEnemies = new Set();
        for (let i = 0; i < actualMoveDistance; i++) {
            const step = path[i];
            const worldX = step.x * tileSize + tileSize / 2;
            const worldY = step.y * tileSize + tileSize / 2;

            const enemiesInPath = findEntitiesInRadius(worldX, worldY, tileSize, allEnemies, entity);
            for (const enemy of enemiesInPath) {
                if (!hitEnemies.has(enemy.id)) {
                    if (eventManager) {
                        eventManager.publish('entity_attack', { attacker: entity, defender: enemy, skill: { name: '돌진' } });
                    }
                    if (vfxManager && strikeImage) {
                        vfxManager.addSpriteEffect(strikeImage, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, { blendMode: 'screen' });
                    }
                    hitEnemies.add(enemy.id);
                }
            }
        }

        if (!this.mapManager.isWallAt(destX, destY, entity.width, entity.height)) {
            entity.x = destX;
            entity.y = destY;
        }
    }

    /**
     * 목표(target)를 주체(subject)의 바로 앞으로 끌어옵니다.
     * @param {Entity} target - 끌려올 대상
     * @param {Entity} subject - 끌어오는 주체
     */
    pullTargetTo(target, subject) {
        const tileSize = this.mapManager.tileSize;
        const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        let bestPos = null;
        let minDistanceToTarget = Infinity;

        for (const dir of dirs) {
            const checkX = subject.x + dir.x * tileSize;
            const checkY = subject.y + dir.y * tileSize;

            if (!this.mapManager.isWallAt(checkX, checkY, target.width, target.height)) {
                const distance = Math.hypot(checkX - target.x, checkY - target.y);
                if (distance < minDistanceToTarget) {
                    minDistanceToTarget = distance;
                    bestPos = { x: checkX, y: checkY };
                }
            }
        }

        if (bestPos) {
            target.x = bestPos.x;
            target.y = bestPos.y;
        }
    }
}
