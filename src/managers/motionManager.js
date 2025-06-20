export class MotionManager {
    constructor(mapManager, pathfindingManager) {
        this.mapManager = mapManager;
        this.pathfindingManager = pathfindingManager;
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
            console.log(`[MotionManager] 돌진: (${entity.x}, ${entity.y}) → (${destX}, ${destY}), 거리: ${actualMoveDistance}칸`);
            entity.x = destX;
            entity.y = destY;
        } else {
            console.log('[MotionManager] 돌진 실패: 목적지에 벽이 있음');
        }
    }

    /**
     * 목표(target)를 주체(subject)의 바로 앞으로 끌어옵니다.
     * @param {Entity} target - 끌려올 대상
     * @param {Entity} subject - 끌어오는 주체
     */
    pullTargetTo(target, subject) {
        const tileSize = this.mapManager.tileSize;
        const destX = subject.x;
        const destY = subject.y - tileSize;

        if (!this.mapManager.isWallAt(destX, destY, target.width, target.height)) {
            console.log(`[MotionManager] 끌어당기기: ${target.constructor.name}를 (${target.x}, ${target.y}) → (${destX}, ${destY})로 이동`);
            // TODO: 채찍이 날아가는 VFX 요청
            // eventManager.publish('vfx_request', { type: 'whip_trail', from: subject, to: target });
            target.x = destX;
            target.y = destY;
        } else {
            console.log('[MotionManager] 끌어당기기 실패: 목적지에 벽이 있음');
        }
    }
}
