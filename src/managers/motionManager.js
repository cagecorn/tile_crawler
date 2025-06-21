import { findEntitiesInRadius } from '../utils/entityUtils.js';

export class MotionManager {
    constructor(mapManager, pathfindingManager) {
        this.mapManager = mapManager;
        this.pathfindingManager = pathfindingManager;
        console.log("[MotionManager] Initialized");
    }

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
            vfxManager.createDashTrail(startPos.x, startPos.y, destX, destY);
        }

        const hitEnemies = new Set();
        for (let i = 0; i < actualMoveDistance; i++) {
            const step = path[i];
            const worldX = step.x * tileSize + tileSize / 2;
            const worldY = step.y * tileSize + tileSize / 2;
            
            const enemiesInPath = findEntitiesInRadius(worldX, worldY, tileSize, allEnemies, entity);
            for(const enemy of enemiesInPath) {
                if(!hitEnemies.has(enemy.id)) {
                    if(eventManager) {
                        // entity_attack 대신 charge_hit 이벤트를 발생시킵니다.
                        eventManager.publish('charge_hit', { attacker: entity, defender: enemy });
                    }
                    if (vfxManager && strikeImage) {
                         vfxManager.addSpriteEffect(strikeImage, enemy.x + enemy.width/2, enemy.y + enemy.height/2, { blendMode: 'screen' });
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

    pullTargetTo(target, subject, vfxManager) {
        const tileSize = this.mapManager.tileSize;
        
        const dirs = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
        let bestPos = null;
        let minDistanceToTarget = Infinity;

        for(const dir of dirs) {
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
            if (vfxManager) {
                const fromPos = { x: target.x, y: target.y };
                console.log(`[MotionManager] 끌어당기기 애니메이션 시작: ${target.constructor.name}를 (${fromPos.x}, ${fromPos.y}) → (${bestPos.x}, ${bestPos.y})로 이동`);
                vfxManager.addPullAnimation(target, fromPos, bestPos);
            } else {
                target.x = bestPos.x;
                target.y = bestPos.y;
            }
        } else {
            console.log('[MotionManager] 끌어당기기 실패: 주체 주변에 공간이 없습니다.');
        }
    }

    /**
     * 대상을 공격자로부터 멀어지는 방향으로 밀어냅니다.
     * @param {Entity} target - 밀려날 대상
     * @param {Entity} source - 공격자
     * @param {number} distance - 밀려날 거리
     * @param {VFXManager} vfxManager - 애니메이션을 위한 VFX 매니저
     */
    knockbackTarget(target, source, distance, vfxManager) {
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const destX = target.x + Math.cos(angle) * distance;
        const destY = target.y + Math.sin(angle) * distance;

        if (this.mapManager.isWallAt(destX, destY, target.width, target.height)) {
            console.log('[MotionManager] 넉백 실패: 목적지에 벽이 있음');
            return;
        }

        if (vfxManager) {
            const fromPos = { x: target.x, y: target.y };
            const toPos = { x: destX, y: destY };
            vfxManager.addKnockbackAnimation(target, fromPos, toPos);
        } else {
            target.x = destX;
            target.y = destY;
        }
    }
}
