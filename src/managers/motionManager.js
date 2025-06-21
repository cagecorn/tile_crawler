export class MotionManager {
    constructor(mapManager, pathfindingManager, eventManager = null) {
        this.mapManager = mapManager;
        this.pathfindingManager = pathfindingManager;
        this.eventManager = eventManager;
        console.log("[MotionManager] Initialized");
    }

    // dash the entity toward the target up to maxTiles tiles
    dashTowards(entity, target, maxTiles = 8) {
        const tileSize = this.mapManager.tileSize;

        // convert entity and target positions to tile coordinates
        const startX = Math.floor(entity.x / tileSize);
        const startY = Math.floor(entity.y / tileSize);
        const endX = Math.floor(target.x / tileSize);
        const endY = Math.floor(target.y / tileSize);

        // get path to the target; ignore dynamic blockers for dash
        const path = this.pathfindingManager.findPath(startX, startY, endX, endY, () => false);
        // if there is nowhere to move, stop
        if (path.length < 2) return;

        // decide how many tiles to actually move
        const actualMoveDistance = Math.min(maxTiles, path.length);
        // path[0] is the first step after the starting tile
        const dest = path[actualMoveDistance - 1];
        const destX = dest.x * tileSize;
        const destY = dest.y * tileSize;

        // move only if destination is not a wall
        if (!this.mapManager.isWallAt(destX, destY, entity.width, entity.height)) {
            const startPos = { x: entity.x, y: entity.y };
            console.log(`[MotionManager] \ub3cc\uc9c4: (${entity.x}, ${entity.y}) \u2192 (${destX}, ${destY}), \uac70\ub9ac: ${actualMoveDistance}\uce78`);
            entity.x = destX;
            entity.y = destY;
            if (this.eventManager) {
                this.eventManager.publish('vfx_request', {
                    type: 'dash_trail',
                    from: startPos,
                    to: { x: destX, y: destY },
                });
            }
        } else {
            console.log('[MotionManager] \ub3cc\uc9c4 \uc2e4\ud328: \ubaa9\uc801\uc9c0\uc5d0 \ubc29\ud328\uac00 \uc788\uc74c');
        }
    }

    /**
     * \ubaa9\ud45c(target)\ub97c \uc8fc\uccb4(subject)\uc758 \ubc14\ub85c \uc55e\uc73c\ub85c \ub04c\uc5b4\uc628\ub2e4.
     * @param {Entity} target - \ub04c\ub824\uc62c \ub300\uc0c1
     * @param {Entity} subject - \ub04c\uc5b4\uc624\ub294 \uc8fc\uccb4
     */
    pullTargetTo(target, subject) {
        const tileSize = this.mapManager.tileSize;
        
        // \uc8fc\uccb4 \uc8fc\ubd80\uc758 \uc0c1\ud558\uc88c\uc6b0 \ud0c0\uc77c\uc744 \ud638\ubd80\ub85c \ud0d0\uc0b0
        const dirs = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
        let bestPos = null;
        let minDistanceToTarget = Infinity;

        // \uc8fc\uccb4 \uc8fc\ubd80\uc758 \ube44\uc5b4\uc788\ub294 \ud0c0\uc77c \uc911, \uc6d0\ub798 \ud0c0\uac9f \uc704\uce58\uc640 \uac00\uc7a5 \uac00\uae4c\uc6b4 \uac83\uc744 \ucc3e\ub294\ub2e4.
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
            console.log(`[MotionManager] \ub04c\uc5b4\ub2e4\ub2c8\uae30: ${target.constructor.name}\ub97c (${target.x}, ${target.y}) \u2192 (${bestPos.x}, ${bestPos.y})\ub85c \uc774\ub3d9`);
            target.x = bestPos.x;
            target.y = bestPos.y;
            if (this.eventManager) {
                this.eventManager.publish('vfx_request', {
                    type: 'whip_trail',
                    from: { x: subject.x, y: subject.y },
                    to: { x: target.x, y: target.y },
                });
            }
        } else {
            console.log('[MotionManager] \ub04c\uc5b4\ub2e4\ub2c8\uae30 \uc2e4\ud328: \uc8fc\uccb4 \uc8fc\ubd80\uc5d0 \uacf5\uac04\uc774 \uc5c6\uc74c');
        }
    }
}
