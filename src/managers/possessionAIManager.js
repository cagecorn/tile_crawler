import { SKILLS } from '../data/skills.js';

export class PossessionAIManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.ghosts = [];
        this.possessedEntities = new Set();

        if (this.eventManager) {
            this.eventManager.subscribe('emblem_equipped', ({ entity, emblemItem }) => {
                this.addPossession(entity, emblemItem.possessionAI);
            });
            this.eventManager.subscribe('emblem_unequipped', ({ entity }) => {
                this.removePossession(entity);
            });
        }
        console.log('[PossessionAIManager] Initialized');
    }

    addGhost(ghost) {
        this.ghosts.push(ghost);
    }

    addPossession(entity, ghostAI) {
        if (entity.possessedBy) return;
        entity.possessedBy = ghostAI;
        this.possessedEntities.add(entity);
        console.log(`${entity.constructor.name} in possession by ${ghostAI.constructor.name}`);
    }

    removePossession(entity) {
        if (!entity.possessedBy) return;
        entity.possessedBy = null;
        this.possessedEntities.delete(entity);
    }

    update(context) {
        const unpossessedMonsters = context.monsterManager.monsters.filter(m => !m.possessedBy);

        for (const ghost of this.ghosts) {
            if (ghost.host && ghost.host.hp <= 0) {
                this.removePossession(ghost.host);
                ghost.host = null;
                ghost.state = 'seeking';
            }

            if (ghost.state === 'seeking' && unpossessedMonsters.length > 0) {
                let foundHost = null;
                for (let i = unpossessedMonsters.length - 1; i >= 0; i--) {
                    const monster = unpossessedMonsters[i];
                    let isMatch = false;
                    switch (ghost.type) {
                        case 'tanker':
                            isMatch = monster.equipment?.off_hand?.tags.includes('shield');
                            break;
                        case 'ranged':
                            isMatch = monster.equipment?.main_hand?.tags.includes('ranged');
                            break;
                        case 'supporter':
                            isMatch = monster.skills.includes('heal') || monster.consumables.some(item => item.tags.includes('healing_item'));
                            break;
                        case 'cc':
                            const ccWeapons = ['spear', 'whip', 'estoc'];
                            isMatch = ccWeapons.some(w => monster.equipment?.main_hand?.name.includes(w)) || monster.skills.some(s => SKILLS[s]?.tags.includes('debuff'));
                            break;
                    }
                    if (isMatch) {
                        foundHost = monster;
                        unpossessedMonsters.splice(i, 1);
                        break;
                    }
                }

                if (foundHost) {
                    ghost.host = foundHost;
                    ghost.state = 'possessing';
                    this.addPossession(foundHost, ghost.ai);
                    this.eventManager.publish('log', { message: `👻 유령이 ${foundHost.constructor.name}에게 빙의했습니다!`, color: 'magenta' });
                }
            }
        }
    }
}
