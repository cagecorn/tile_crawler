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
        console.log("[PossessionAIManager] Initialized");
    }

    addGhost(ghost) {
        this.ghosts.push(ghost);
    }

    addPossession(entity, ghostAI) {
        if (entity.possessedBy) this.removePossession(entity);
        entity.possessedBy = ghostAI;
        this.possessedEntities.add(entity);
        // TODO: 빙의 시 시각 효과(VFX) 추가
        this.eventManager.publish('log', { message: `👻 유령(${ghostAI.constructor.name.replace('AI','')})이 ${entity.constructor.name}에게 빙의했습니다!`, color: 'magenta' });
    }

    removePossession(entity) {
        if (!entity.possessedBy) return;
        this.eventManager.publish('log', { message: `👻 ${entity.constructor.name}에게서 유령이 빠져나왔습니다.`, color: 'magenta' });
        entity.possessedBy = null;
        this.possessedEntities.delete(entity);
    }
    
    update(context) {
        const unpossessedMonsters = context.monsterManager.monsters.filter(m => !m.possessedBy && m.hp > 0);

        for (const ghost of this.ghosts) {
            // 1. 숙주가 죽었으면 새로운 숙주를 찾음
            if (ghost.host && (ghost.host.hp <= 0 || !ghost.host.isFriendly)) {
                this.removePossession(ghost.host);
                ghost.host = null;
                ghost.state = 'seeking';
            }

            // 2. 숙주를 찾는 중이라면
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
                            isMatch = monster.skills.some(s => SKILLS[s]?.tags.includes('healing')) || monster.consumables.some(item => item.tags.includes('healing_item'));
                            break;
                        case 'cc':
                            const ccWeapons = ['spear', 'whip', 'estoc'];
                            isMatch = ccWeapons.some(w => monster.equipment?.main_hand?.name.toLowerCase().includes(w)) || monster.skills.some(s => SKILLS[s]?.tags.includes('debuff'));
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
                }
            }
        }
        
        // 3. 빙의된 유닛의 AI 실행 (3단계에서 구현)
        for (const entity of this.possessedEntities) {
            if (entity.possessedBy && entity.hp > 0) {
                const action = entity.possessedBy.decideAction(entity, context);
                // context에 MetaAIManager가 없으므로, game.js에서 가져와야 함
                context.metaAIManager.executeAction(entity, action, context);
            }
        }
    }
}
