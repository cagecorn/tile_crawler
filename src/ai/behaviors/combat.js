import { Behavior } from './base.js';
import { hasLineOfSight } from '../../utils/geometry.js';

const ENGAGEMENT_RATIO = 0.6;

export class CombatBehavior extends Behavior {
    decideAction(self, context) {
        const { player, enemies, mapManager, eventManager } = context;
        if (!enemies || enemies.length === 0) {
            return { type: 'idle' };
        }

        const currentVisionRange = self.stats?.get('visionRange') ?? self.visionRange;
        const visibleEnemies = enemies.filter(e => {
            const distance = Math.hypot(e.x - self.x, e.y - self.y);
            if (distance > currentVisionRange) return false;
            if (!mapManager) return true;
            return hasLineOfSight(
                Math.floor(self.x / mapManager.tileSize),
                Math.floor(self.y / mapManager.tileSize),
                Math.floor(e.x / mapManager.tileSize),
                Math.floor(e.y / mapManager.tileSize),
                mapManager
            );
        });
        if (visibleEnemies.length === 0) {
            return { type: 'idle' };
        }

        const mbti = self.properties?.mbti || '';
        let potentialTargets = [...visibleEnemies];
        let triggeredTraits = [];

        if (mbti.includes('T')) {
            potentialTargets.sort((a, b) => a.hp - b.hp);
            if (potentialTargets.length > 0) triggeredTraits.push('T');
        } else if (mbti.includes('F')) {
            const allyTargets = new Set(context.allies.map(a => a.currentTarget?.id).filter(Boolean));
            const focusedTarget = potentialTargets.find(t => allyTargets.has(t.id));
            if (focusedTarget) {
                potentialTargets = [focusedTarget];
                triggeredTraits.push('F');
            }
        }

        const nearestTarget = potentialTargets.sort((a, b) => Math.hypot(a.x - self.x, a.y - self.y) - Math.hypot(b.x - self.x, b.y - self.y))[0];
        if (!nearestTarget) return { type: 'idle' };

        self.currentTarget = nearestTarget;
        const distance = Math.hypot(nearestTarget.x - self.x, nearestTarget.y - self.y);

        // 교전 시작 거리를 시야의 일부 비율로 제한하여 즉시 돌격을 방지한다
        const engagementRange = currentVisionRange * ENGAGEMENT_RATIO;

        if (distance > engagementRange && distance > self.attackRange) {
            return { type: 'idle' };
        }

        const weaponTags = self.equipment?.weapon?.tags || [];
        const isRanged = weaponTags.includes('ranged') || weaponTags.includes('bow');

        if (mbti.includes('J')) triggeredTraits.push('J');
        if (mbti.includes('P')) triggeredTraits.push('P');

        if (isRanged) {
            const isTooClose = distance < self.tileSize;
            if (distance < self.attackRange * 0.5 && !mbti.includes('P') && !isTooClose) {
                const retreatTarget = { x: self.x - (nearestTarget.x - self.x), y: self.y - (nearestTarget.y - self.y) };
                return { type: 'move', target: retreatTarget, triggeredTraits };
            }
        }

        if (distance < self.attackRange) {
            return { type: 'attack', target: nearestTarget, triggeredTraits };
        }

        return { type: 'move', target: nearestTarget, triggeredTraits };
    }
}
