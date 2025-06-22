// cagecorn/tile_crawler/tile_crawler-2d759b9cade79b473f9268929692ac3e543351f9/src/engine.js

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
        this.eventManager = new EventManager();
        this.layerManager = new LayerManager();
        this.inputHandler = new InputHandler(this.eventManager);
        this.mapManager = new AquariumMapManager();
        this.factory = new CharacterFactory(assets);
        
        // ✨ 게임 상태와 관리자를 null로 초기화합니다.
        this.managers = null;
        this.gameState = null;
        this.gameLoop = null;
    }

    /**
     * ✨ 게임에 필요한 모든 구성 요소를 설정하는 초기화 메서드를 추가합니다.
     */
    initialize() {
        this.managers = createManagers(this.eventManager, this.assets, this.factory, this.mapManager);
        this.gameState = buildInitialWorld(this.managers, this.assets);

        // UI 매니저 초기화 시 gameState를 전달하여 UI가 게임 상태를 알 수 있도록 합니다.
        this.managers.uiManager.init(this.gameState, {
            onStatUp: (stat) => {
                if (this.gameState.statPoints > 0) {
                    this.gameState.statPoints--;
                    this.gameState.player.stats.allocatePoint(stat);
                    this.gameState.player.stats.recalculate();
                }
            },
            onEquipItem: (entity, item) => {
                this.managers.equipmentManager.equip(entity, item, this.gameState.inventory);
                this.gameState.inventory = this.gameState.inventory.filter(i => i !== item);
                this.managers.uiManager.renderInventory(this.gameState);
            },
            onEnhanceItem: (item) => {
                this.managers.enhancementManager.enhanceItem(this.gameState.player, item, this.gameState);
            },
        });

        registerGameEventListeners(this);

        this.gameLoop = new GameLoop(this.update, this.render);
    }

    start() {
        if (!this.gameLoop) {
            console.error("Engine not initialized before starting. Call initialize() first.");
            return;
        }
        this.gameLoop.start();
    }

    update = (deltaTime) => {
        // Publish a simple frame debug event so SystemLogManager can display
        // periodic heartbeat logs. The SystemLogManager throttles 'Frame'
        // tagged events to once every ~60 frames, so this won't spam the log.
        this.eventManager.publish('debug', {
            tag: 'Frame',
            message: `dt=${Math.round(deltaTime)}`
        });

        if (this.gameState.isPaused || this.gameState.isGameOver) return;

        const { player } = this.gameState;
        const { monsterManager, mercenaryManager, petManager, itemManager, aiEngine, fogManager, projectileEngine } = this.managers;

        this.managers.knockbackEngine.update();
        this.managers.vfxEngine.update();
        this.managers.spriteEngine?.update();

        // Player movement
        let moveX = 0, moveY = 0;
        if (this.inputHandler.keysPressed['ArrowUp']) moveY -= player.speed;
        if (this.inputHandler.keysPressed['ArrowDown']) moveY += player.speed;
        if (this.inputHandler.keysPressed['ArrowLeft']) moveX -= player.speed;
        if (this.inputHandler.keysPressed['ArrowRight']) moveX += player.speed;

        if (moveX !== 0 || moveY !== 0) {
            const newX = player.x + moveX;
            const newY = player.y + moveY;
            if (!this.mapManager.isWallAt(newX, player.y, player.width, player.height)) {
                player.x = newX;
            }
            if (!this.mapManager.isWallAt(player.x, newY, player.width, player.height)) {
                player.y = newY;
            }
        }

        if (typeof player.update === 'function') {
            player.update();
        }

        const mercs = mercenaryManager?.mercenaries || [];
        const monsters = monsterManager?.monsters || [];
        const pets = petManager?.pets || [];
        const allEntities = [player, ...mercs, ...monsters, ...pets];

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
        };

        projectileEngine.update(allEntities);

        // ✨ AI 엔진을 루프의 가장 마지막에 업데이트하여 다른 시스템의 변경사항을 모두 반영하도록 합니다.
        Object.entries(this.managers).forEach(([name, manager]) => {
            if (typeof manager.update === 'function' && manager !== aiEngine) {
                if (name === 'fogManager' || name === 'knockbackEngine' || name === 'vfxEngine' || name === 'spriteEngine' || name === 'uiManager' || name === 'projectileManager' || name === 'projectileEngine') return;
                try {
                    manager.update(allEntities, context);
                } catch (err) {
                    console.error(`Manager ${name} update error`, err);
                    this.eventManager.publish('debug', { tag: 'ERROR', message: `${name} update failed: ${err.message}` });
                }
            }
        });
        
        try {
            aiEngine.update(context);
        } catch (err) {
            console.error('AI update error', err);
            this.eventManager.publish('debug', { tag: 'ERROR', message: `AI update failed: ${err.message}` });
        }

        // Item pickup handling
        const itemToPick = itemManager.items.find(
            item => Math.hypot(player.x - item.x, player.y - item.y) < player.width
        );
        if (itemToPick) {
            itemManager.removeItem(itemToPick);
            this.gameState.inventory.push(itemToPick);
        }

        fogManager.update(player, this.mapManager);
        this.managers.uiManager.updateUI(this.gameState);
    }

    render = () => {
        if (!this.gameState || this.gameState.isGameOver) return;
        this.layerManager.clear();
        
        const { camera, zoomLevel, player } = this.gameState;
        if (!player) return; // 안전장치
        
        const canvas = this.layerManager.layers.entity;

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
        
        const allMercs = this.managers.mercenaryManager?.mercenaries || [];
        const allMonsters = this.managers.monsterManager?.monsters || [];
        
        this.managers.uiManager.renderHpBars(this.layerManager.contexts.vfx, player, allMonsters, allMercs);
        this.managers.effectIconManager.render(
            this.layerManager.contexts.vfx,
            [player, ...allMonsters, ...allMercs],
            EFFECTS
        );
        this.managers.fogManager.render(this.layerManager.contexts.weather, this.mapManager.tileSize);

        Object.values(this.layerManager.contexts).forEach(ctx => ctx.restore());
        
        // This call is now in the update loop to ensure data consistency
        // this.managers.uiManager.updateUI(this.gameState); 
    }
}
