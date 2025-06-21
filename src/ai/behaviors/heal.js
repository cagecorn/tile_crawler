import { Behavior } from './base.js';
import { SKILLS } from '../../data/skills.js';
import { hasLineOfSight } from '../../utils/geometry.js';

export class HealBehavior extends Behavior {
    decideAction(self, context) {
        const { allies, mapManager } = context;
        const mbti = self.properties?.mbti || '';
        const healSkill = SKILLS.heal;
        if (!self.skills.includes(healSkill.id) || self.mp < healSkill.manaCost || (self.skillCooldowns[healSkill.id] || 0) > 0) {
            return { type: 'idle' };
        }

        let healThreshold = mbti.includes('S') ? 0.9 : mbti.includes('N') ? 0.5 : 0.7;
        const candidates = allies.filter(a => a.hp < a.maxHp && a.hp / a.maxHp <= healThreshold);
        if (candidates.length === 0) {
            return { type: 'idle' };
        }

        let target = mbti.includes('I') ? (candidates.find(c => c === self) || candidates[0])
                    : candidates.reduce((lowest, cur) => (cur.hp / cur.maxHp < lowest.hp / lowest.maxHp ? cur : lowest), candidates[0]);
        if (!target) return { type: 'idle' };

        const distance = Math.hypot(target.x - self.x, target.y - self.y);
        if (distance < self.attackRange && hasLineOfSight(Math.floor(self.x/mapManager.tileSize), Math.floor(self.y/mapManager.tileSize), Math.floor(target.x/mapManager.tileSize), Math.floor(target.y/mapManager.tileSize), mapManager)) {
            let triggeredTraits = [];
            if (mbti.includes('S')) triggeredTraits.push('S');
            if (mbti.includes('N')) triggeredTraits.push('N');
            if (mbti.includes('E')) triggeredTraits.push('E');
            if (mbti.includes('I')) triggeredTraits.push('I');
            return { type: 'skill', target, skillId: healSkill.id, triggeredTraits };
        } else {
            return { type: 'move', target };
        }
    }
}
