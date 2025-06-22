import { disarmWorkflow, armorBreakWorkflow, monsterDeathWorkflow } from '../workflows.js';
import { SKILLS } from '../data/skills.js';
import { Item } from '../entities.js';
export function registerGameEventListeners(engine) {
    const { eventManager, managers, gameState, assets } = engine;
    const { combatCalculator, vfxManager, effectManager, monsterManager, itemManager, uiManager, motionManager, equipmentManager, projectileManager } = managers;

    
    eventManager.subscribe('game_over', () => {
        gameState.isGameOver = true;
        alert("게임 오버!");
    });

    eventManager.subscribe('player_levelup_bonus', (data) => {
        gameState.statPoints += data.statPoints;
    });

    eventManager.subscribe('weapon_disarmed', (data) => disarmWorkflow({ ...data, ...managers }));
    eventManager.subscribe('armor_broken', (data) => armorBreakWorkflow({ ...data, ...managers }));

    eventManager.subscribe('damage_calculated', (data) => {
        data.defender.takeDamage(data.damage);
        eventManager.publish('entity_damaged', { ...data });
        if (data.defender.hp <= 0) {
            eventManager.publish('entity_death', { attacker: data.attacker, victim: data.defender });
        }
    });

    eventManager.subscribe('entity_death', (data) => {
        vfxManager.addDeathAnimation(data.victim, 'explode');
        if (data.victim.unitType === 'monster') {
            const corpse = new Item(data.victim.x, data.victim.y, data.victim.tileSize, 'corpse', assets.corpse);
            itemManager.addItem(corpse);
        }
        const context = {
            eventManager,
            attacker: data.attacker,
            victim: data.victim,
            player: gameState.player
        };
        monsterDeathWorkflow(context);
    });

    eventManager.subscribe('key_pressed', (data) => {
        if (gameState.isPaused || gameState.isGameOver) return;
        const skillIndex = parseInt(data.key) - 1;
        if (skillIndex >= 0 && skillIndex < gameState.player.skills.length) {
            const skillId = gameState.player.skills[skillIndex];
            const skillData = SKILLS[skillId];
            if (skillData && (gameState.player.skillCooldowns[skillId] || 0) <= 0 && gameState.player.mp >= skillData.manaCost) {
                gameState.player.mp -= skillData.manaCost;
                gameState.player.skillCooldowns[skillId] = skillData.cooldown;
                eventManager.publish('skill_used', { caster: gameState.player, skill: skillData, target: null });
            }
        }
    });


    uiManager.init({
        onStatUp: (stat) => {
            if (gameState.statPoints > 0) {
                gameState.statPoints--;
                gameState.player.stats.allocatePoint(stat);
                gameState.player.stats.recalculate();
            }
        },
        onEquipItem: (entity, item) => {
            equipmentManager.equip(entity, item, gameState.inventory);
            gameState.inventory = gameState.inventory.filter(i => i !== item);
            uiManager.renderInventory(gameState);
        },
        onEnhanceItem: (item) => {
            managers.enhancementManager.enhanceItem(gameState.player, item, gameState);
        },
        enhancementManager: managers.enhancementManager,
    });

}
