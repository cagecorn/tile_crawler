import { Behavior } from './base.js';
import { SKILLS } from '../../data/skills.js';

export class BardBehavior extends Behavior {
    decideAction(self, context) {
        const { player, allies } = context;
        const songs = [SKILLS.guardian_hymn, SKILLS.courage_hymn];
        
        for (const song of songs) {
            if (self.skills.includes(song.id) && self.mp >= song.manaCost && (self.skillCooldowns[song.id] || 0) <= 0) {
                const alliesWithoutBuff = allies.filter(a => !a.effects.some(e => e.id === song.effects.target[0]));
                if (alliesWithoutBuff.length > 0) {
                    return { type: 'skill', target: self, skillId: song.id, triggeredTraits: ['E'] };
                }
            }
        }
        return { type: 'idle' };
    }
}
