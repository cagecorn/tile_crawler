import { disarmWorkflow, armorBreakWorkflow } from '../workflows.js';
import { SKILLS } from '../data/skills.js';
import { rollOnTable } from '../utils/random.js';
import { getMonsterLootTable } from '../data/tables.js';
import { Item } from '../entities.js';

export function registerGameEventListeners(engine) {
    const { eventManager, managers, gameState, assets } = engine;
    const { combatCalculator, vfxManager, effectManager, monsterManager, itemManager, uiManager, motionManager, equipmentManager, projectileManager } = managers;

    eventManager.subscribe('entity_attack', (data) => {
        if (!data.attacker || !data.defender) return;
        managers.microCombatManager.resolveAttack(data.attacker, data.defender);
        combatCalculator.handleAttack(data);
        if (!data.skill || !data.skill.projectile) {
            vfxManager.addSpriteEffect(assets['strike-effect'], data.defender.x, data.defender.y, { width: data.defender.width, height: data.defender.height });
        }
    });

    eventManager.subscribe('damage_calculated', (data) => {
        data.defender.takeDamage(data.damage);
        eventManager.publish('entity_damaged', { ...data });
        if (data.defender.hp <= 0) {
            eventManager.publish('entity_death', { attacker: data.attacker, victim: data.defender });
        }
    });
    
    eventManager.subscribe('entity_damaged', (data) => {
        vfxManager.flashEntity(data.defender, {color: 'rgba(255, 100, 100, 0.6)'});
        const sleepEffect = data.defender.effects.find(e => e.id === 'sleep');
        if (sleepEffect) {
            sleepEffect.hitsTaken = (sleepEffect.hitsTaken || 0) + 1;
            if (sleepEffect.hitsTaken >= (sleepEffect.wakeUpOnHit || 1)) {
                effectManager.removeEffect(data.defender, sleepEffect);
            }
        }
    });

    eventManager.subscribe('entity_death', (data) => {
        vfxManager.addDeathAnimation(data.victim, 'explode');
        if (!data.victim.isFriendly && (data.attacker.isPlayer || data.attacker.isFriendly)) {
            const exp = data.victim.expValue || 0;
            if (exp > 0) eventManager.publish('exp_gained', { player: data.attacker, exp });
        }
        if (data.victim.unitType === 'monster') {
            const corpse = new Item(data.victim.x, data.victim.y, data.victim.tileSize, 'corpse', assets.corpse);
            itemManager.addItem(corpse);
        }
    });
    
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

    // Top menu buttons open their corresponding panels
    document.querySelectorAll('.menu-btn[data-panel-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            uiManager.showPanel(btn.dataset.panelId);
            if (gameState) gameState.isPaused = true;
        });
    });
}
