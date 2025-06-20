export class MovementManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.stuckTimers = new Map(); // 유닛이 얼마나 오래 끼어있는지 추적
    }

    // 이 매니저의 핵심 함수
    moveEntityTowards(entity, target) {
        const distance = Math.hypot(target.x - entity.x, target.y - entity.y);
        if (distance < entity.width) { // 목표에 거의 도달했으면 멈춤
            this.stuckTimers.delete(entity.id);
            return;
        }

        // 목표까지 남은 거리가 이동 속도 이하라면 바로 도착 처리하여
        // 소수점 이동으로 인한 떨림을 방지한다
        if (distance <= entity.speed) {
            entity.x = target.x;
            entity.y = target.y;
            this.stuckTimers.delete(entity.id);
            return;
        }

        // 1. 관성: 거리가 멀수록 속도 증가
        const speedBonus = Math.min(5, Math.floor(distance / this.mapManager.tileSize / 2));
        const currentSpeed = entity.speed + speedBonus;

        let vx = ((target.x - entity.x) / distance) * currentSpeed;
        let vy = ((target.y - entity.y) / distance) * currentSpeed;

        let newX = entity.x + vx;
        let newY = entity.y + vy;

        // 2. 미끄러지기: 직접 가는 길이 막혔는지 확인
        if (this._isOccupied(newX, newY, entity)) {
            // X축으로만 이동 시도
            if (!this._isOccupied(newX, entity.y, entity)) {
                entity.x = newX;
                this.stuckTimers.delete(entity.id);
                return;
            }
            // Y축으로만 이동 시도
            if (!this._isOccupied(entity.x, newY, entity)) {
                entity.y = newY;
                this.stuckTimers.delete(entity.id);
                return;
            }

            // 3. 순간이동: 양쪽 다 막혔다면 '끼임' 상태로 간주
            const stuckTime = (this.stuckTimers.get(entity.id) || 0) + 1;
            this.stuckTimers.set(entity.id, stuckTime);

            if (stuckTime > 180) { // 3초 이상 끼어있으면
                const safePos = this.mapManager.getRandomFloorPosition(null, { around: target, maxRange: 2 });
                if (safePos) {
                    entity.x = safePos.x;
                    entity.y = safePos.y;
                }
                this.stuckTimers.delete(entity.id);
            }

        } else {
            // 길이 안 막혔으면 그냥 이동
            entity.x = newX;
            entity.y = newY;
            this.stuckTimers.delete(entity.id);
        }
    }

    // 특정 위치가 비어있는지 확인하는 헬퍼 함수
    _isOccupied(x, y, self) {
        // 벽 확인
        if (this.mapManager.isWallAt(x, y, self.width, self.height)) return true;
        // 다른 유닛 확인 (나중에 추가)
        return false;
    }
}
