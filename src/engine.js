import { GameLoop } from './gameLoop.js';
import { EventManager } from './managers/eventManager.js';
import { LayerManager } from './managers/layerManager.js';
import { AquariumMapManager } from './aquariumMap.js';
import { CharacterFactory } from './factory.js';
import { InputHandler } from './inputHandler.js';
import { createManagers } from './setup/managerRegistry.js';
import { buildInitialWorld } from './setup/worldBuilder.js';
import { registerGameEventListeners } from './setup/eventListeners.js';
import { EFFECTS } from './data/effects.js';

export class Engine {
    constructor(assets) {
        this.assets = assets;
        this.layerManager = new LayerManager();
        this.eventManager = new EventManager();
        this.inputHandler = new InputHandler(this.eventManager);
        this.mapManager = new AquariumMapManager();
        this.factory = new CharacterFactory(assets);
        
        this.managers = createManagers(this.eventManager, this.assets, this.factory, this.mapManager);
        this.gameState = buildInitialWorld(this.managers, this.assets);

        registerGameEventListeners(this);

        this.gameLoop = new GameLoop(this.update, this.render);
    }

    start() {
        this.gameLoop.start();
    }

    update = (deltaTime) => {
        if (this.gameState.isPaused || this.gameState.isGameOver) return;
        
        const { player } = this.gameState;
        const { monsterManager, mercenaryManager, petManager, itemManager, aiEngine, fogManager } = this.managers;

        // --- KnockbackEngine 업데이트 루프 추가 ---
        this.managers.knockbackEngine.update();

        // Player movement
        let moveX = 0, moveY = 0;
        if (this.inputHandler.keysPressed['ArrowUp']) moveY -= player.speed;
        if (this.inputHandler.keysPressed['ArrowDown']) moveY += player.speed;
        if (this.inputHandler.keysPressed['ArrowLeft']) moveX -= player.speed;
        if (this.inputHandler.keysPressed['ArrowRight']) moveX += player.speed;
        if (moveX !== 0 || moveY !== 0) {
            player.x += moveX;
            player.y += moveY;
        }

        // Update all managers
        const allEntities = [player, ...mercenaryManager.mercenaries, ...monsterManager.monsters, ...petManager.pets];

        const context = {
            player,
            playerGroup: aiEngine.groups['player_party'],
            monsterManager,
            mercenaryManager,
            petManager,
            itemManager,
            mapManager: this.mapManager,
            eventManager: this.eventManager,
            assets: this.assets,
            projectileManager: this.managers.projectileManager,
            effectManager: this.managers.effectManager,
            speechBubbleManager: this.managers.speechBubbleManager,
            movementManager: this.managers.movementManager,
            motionManager: this.managers.motionManager,
            aiEngine,
            onPlayerAttack: (damage) => {
                player.takeDamage(damage);
                if (player.hp <= 0) {
                    this.eventManager.publish('game_over');
                }
            },
            onMonsterAttacked: (id, damage) => {
                const monster = monsterManager.monsters.find(m => m.id === id);
                if (monster) {
                    monster.takeDamage(damage);
                    if (monster.hp <= 0) {
                        this.eventManager.publish('entity_death', { attacker: player, victim: monster });
                        monsterManager.removeMonster(monster.id);
                    }
                }
            }
        };

        try {
            aiEngine.update(context);
        } catch (err) {
            console.error('AI update error', err);
            this.eventManager.publish('debug', { tag: 'ERROR', message: `AI update failed: ${err.message}` });
        }

        Object.entries(this.managers).forEach(([name, manager]) => {
            if (typeof manager.update === 'function' && manager !== aiEngine) {
                if (name === 'fogManager' || manager === this.managers.knockbackEngine) return; // 시야 매니저와 넉백 엔진은 별도 처리
                try {
                    manager.update(allEntities);
                } catch (err) {
                    console.error(`Manager ${name} update error`, err);
                    this.eventManager.publish('debug', { tag: 'ERROR', message: `${name} update failed: ${err.message}` });
                }
            }
        });

        // Item pickup
        const itemToPick = itemManager.items.find(item => Math.hypot(player.x - item.x, player.y - item.y) < player.width);
        if (itemToPick) {
            itemManager.removeItem(itemToPick);
            this.gameState.inventory.push(itemToPick);
        }
        
        fogManager.update(player, this.mapManager);
    }

    render = () => {
        if (this.gameState.isGameOver) return;
        this.layerManager.clear();
        
        const { camera, zoomLevel, player } = this.gameState;
        const canvas = this.layerManager.layers.entity;

        // Camera follow
        camera.x = player.x - canvas.width / (2 * zoomLevel);
        camera.y = player.y - canvas.height / (2 * zoomLevel);
        
        Object.values(this.layerManager.contexts).forEach(ctx => {
            ctx.save();
            ctx.scale(zoomLevel, zoomLevel);
            ctx.translate(-camera.x, -camera.y);
        });

        this.mapManager.render(this.layerManager.contexts.mapBase, this.layerManager.contexts.mapDecor, this.assets);
        this.managers.itemManager.render(this.layerManager.contexts.mapDecor);
        this.managers.monsterManager.render(this.layerManager.contexts.entity);
        this.managers.mercenaryManager.render(this.layerManager.contexts.entity);
        this.managers.petManager.render(this.layerManager.contexts.entity);
        player.render(this.layerManager.contexts.entity);
        
        this.managers.vfxManager.render(this.layerManager.contexts.vfx);
        this.managers.projectileManager.render(this.layerManager.contexts.vfx);
        this.managers.speechBubbleManager.render(this.layerManager.contexts.vfx);
        this.managers.uiManager.renderHpBars(this.layerManager.contexts.vfx, player, this.managers.monsterManager.monsters, this.managers.mercenaryManager.mercenaries);
        this.managers.effectIconManager.render(
            this.layerManager.contexts.vfx,
            [player, ...this.managers.monsterManager.monsters, ...this.managers.mercenaryManager.mercenaries],
            EFFECTS
        );
        this.managers.fogManager.render(this.layerManager.contexts.weather, this.mapManager.tileSize);

        Object.values(this.layerManager.contexts).forEach(ctx => ctx.restore());
        
        this.managers.uiManager.updateUI(this.gameState);
    }
}
