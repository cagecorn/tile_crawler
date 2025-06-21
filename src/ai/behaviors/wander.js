import { Behavior } from './base.js';

export class WanderBehavior extends Behavior {
    decideAction(self, context) {
        const { player, allies, mapManager } = context;
        if (!self.isFriendly || self.isPlayer) {
            return { type: 'idle' };
        }
        const target = this._getWanderPosition(self, player, allies, mapManager);
        if (Math.hypot(target.x - self.x, target.y - self.y) > self.tileSize * 0.3) {
            return { type: 'move', target };
        }
        return { type: 'idle' };
    }

    _getWanderPosition(self, player, allies, mapManager) {
        const reached = self.wanderTarget &&
            Math.hypot(self.wanderTarget.x - self.x, self.wanderTarget.y - self.y) < self.tileSize * 0.3;
        if (!self.wanderTarget || reached || self.wanderCooldown <= 0) {
            const base = mapManager ? mapManager.tileSize : self.tileSize;
            const angle = Math.random() * Math.PI * 2;
            const dist = base * (1 + Math.random() * 1.5);
            let x = player.x + Math.cos(angle) * dist;
            let y = player.y + Math.sin(angle) * dist;

            for (const ally of allies) {
                if (ally === self) continue;
                const dx = x - ally.x;
                const dy = y - ally.y;
                const d = Math.hypot(dx, dy);
                if (d > 0 && d < base) {
                    x += (dx / d) * base;
                    y += (dy / d) * base;
                }
            }

            if (mapManager && mapManager.isWallAt(x, y, self.width, self.height)) {
                x = player.x;
                y = player.y;
            }

            self.wanderTarget = { x, y };
            self.wanderCooldown = 60 + Math.floor(Math.random() * 60);
        } else {
            self.wanderCooldown--;
        }

        return self.wanderTarget || player;
    }
}
