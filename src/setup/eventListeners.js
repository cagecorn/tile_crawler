import { disarmWorkflow, armorBreakWorkflow } from '../workflows.js';
import { SKILLS } from '../data/skills.js';
export function registerGameEventListeners(engine) {
    const { eventManager, managers, gameState, assets } = engine;
    const { vfxManager, uiManager, equipmentManager } = managers;

    
    eventManager.subscribe('game_over', () => {
        gameState.isGameOver = true;
        alert("게임 오버!");
    });

    eventManager.subscribe('player_levelup_bonus', (data) => {
        gameState.statPoints += data.statPoints;
    });

    eventManager.subscribe('weapon_disarmed', (data) => disarmWorkflow({ ...data, ...managers }));
    eventManager.subscribe('armor_broken', (data) => armorBreakWorkflow({ ...data, ...managers }));

    eventManager.subscribe('skill_used', (data) => {
        const { caster, skill } = data;
        vfxManager.castEffect(caster, skill);
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

    eventManager.subscribe('ai_mbti_trait_triggered', (data) => {
        vfxManager.addTextPopup(data.trait, data.entity);
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
