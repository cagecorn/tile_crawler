// src/managers.js

import { Item } from './entities.js';
import { MetaAIManager as BaseMetaAI } from './ai-managers.js';
import { rollOnTable } from './utils/random.js';
import { MONSTER_SPAWN_TABLE } from './data/tables.js';

export class MonsterManager {
    constructor(monsterCount, mapManager, assets, eventManager, factory) {
        this.monsters = [];
        this.mapManager = mapManager;
        this.assets = assets;
        this.factory = factory;
        this._spawnMonsters(monsterCount);
        eventManager.subscribe('entity_removed', (data) => {
            if (this.monsters.some(m => m.id === data.victimId)) {
                this.removeMonster(data.victimId);
            }
        });
    }

    _spawnMonsters(count) {
        for (let i = 0; i < count; i++) {
            const monsterType = rollOnTable(MONSTER_SPAWN_TABLE);
            let size, image, config;
            if (monsterType === 'epic_monster') {
                size = { w: 2, h: 2 };
                image = this.assets.epic_monster;
                config = { baseStats: {} };
            } else {
                size = { w: 1, h: 1 };
                image = this.assets.monster;
                config = { baseStats: {} };
            }
            const pos = this.mapManager.getRandomFloorPosition(size);
            if (pos) {
                const monster = this.factory.create('monster', {
                    x: pos.x,
                    y: pos.y,
                    tileSize: this.mapManager.tileSize,
                    groupId: 'dungeon_monsters',
                    image,
                    ...config,
                });
                this.monsters.push(monster);
            }
        }
    }

    handleAttackOnMonster(monsterId, damage) {
        const monster = this.monsters.find(m => m.id === monsterId);
        if (monster) {
            monster.takeDamage(damage);
            return monster.hp <= 0 ? { wasKilled: true, victim: monster } : { wasKilled: false };
        }
        return { wasKilled: false };
    }

    removeMonster(monsterId) {
        this.monsters = this.monsters.filter(m => m.id !== monsterId);
    }

    getMonsterAt(x, y) {
        for (const monster of this.monsters) {
            if (
                x >= monster.x && x < monster.x + monster.width &&
                y >= monster.y && y < monster.y + monster.height
            ) {
                return monster;
            }
        }
        return null;
    }

    update(player, onPlayerAttack) {
        for (const monster of this.monsters) {
            monster.update('aggressive', player, this.mapManager, onPlayerAttack);
        }
    }

    render(ctx) {
        for (const monster of this.monsters) {
            monster.render(ctx);
        }
    }
}

export class MercenaryManager {
    constructor(assets) {
        this.mercenaries = [];
        this.assets = assets;
    }

    hire(mercenary) {
        this.mercenaries.push(mercenary);
        return mercenary;
    }

    render(ctx) {
        for (const merc of this.mercenaries) {
            merc.render(ctx);
        }
    }
}

export class UIManager {
    constructor() {
        this.levelElement = document.getElementById('ui-player-level');
        this.statPointsElement = document.getElementById('ui-player-statPoints');
        this.movementSpeedElement = document.getElementById('ui-player-movementSpeed');
        this.hpElement = document.getElementById('ui-player-hp');
        this.maxHpElement = document.getElementById('ui-player-maxHp');
        this.attackPowerElement = document.getElementById('ui-player-attackPower');
        this.goldElement = document.getElementById('ui-player-gold');
        this.hpBarFillElement = document.getElementById('ui-hp-bar-fill');
        this.expBarFillElement = document.getElementById('ui-exp-bar-fill');
        this.expTextElement = document.getElementById('ui-exp-text');
        this.inventorySlotsElement = document.getElementById('inventory-slots');
        this.statUpButtonsContainer = document.getElementById('player-stats-container');
        // --- 용병 정보창 요소 추가 ---
        this.mercDetailPanel = document.getElementById('mercenary-detail-panel');
        this.mercDetailName = document.getElementById('merc-detail-name');
        this.mercStatsContainer = document.getElementById('merc-stats-container');
        this.closeMercDetailBtn = document.getElementById('close-merc-detail-btn');
        // 장착 대상 선택 패널 요소
        this.equipTargetPanel = document.getElementById('equipment-target-panel');
        this.equipTargetList = document.getElementById('equipment-target-list');
        this._lastInventory = [];
        this._statUpCallback = null;
        this._isInitialized = false;
    }

    init(onStatUp, onEquipItem) {
        if (this._isInitialized) return;
        this._statUpCallback = onStatUp;
        this.onEquipItem = onEquipItem;
        if (this.statUpButtonsContainer) {
            this.statUpButtonsContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('stat-up-btn') || event.target.classList.contains('stat-plus')) {
                    let stat = event.target.dataset.stat;
                    if (!stat && event.target.id && event.target.id.startsWith('btn-plus-')) {
                        stat = event.target.id.replace('btn-plus-', '');
                    }
                    if (stat && this._statUpCallback) {
                        this._statUpCallback(stat);
                    }
                }
            });
        }
        // 닫기 버튼 이벤트
        if (this.closeMercDetailBtn) {
            this.closeMercDetailBtn.onclick = () => this.hideMercenaryDetail();
        }
        this._isInitialized = true;
    }

    setStatUpCallback(cb) {
        this.init(cb);
    }

    // --- 아래 두 메서드를 새로 추가 ---
    showMercenaryDetail(mercenary) {
        if (!this.mercDetailPanel) return;

        this.mercDetailName.textContent = `${mercenary.constructor.name} (Lv.${mercenary.stats.get('level')})`;

        const statsToShow = ['hp', 'maxHp', 'attackPower', 'strength', 'agility', 'endurance', 'movementSpeed'];
        this.mercStatsContainer.innerHTML = '';

        // 레벨 및 경험치 표시
        const levelDiv = document.createElement('div');
        levelDiv.className = 'stat-line';
        levelDiv.textContent = `레벨: ${mercenary.stats.get('level')}`;
        this.mercStatsContainer.appendChild(levelDiv);

        const expDiv = document.createElement('div');
        expDiv.className = 'stat-line';
        expDiv.textContent = `EXP: ${mercenary.stats.get('exp')} / ${mercenary.stats.get('expNeeded')}`;
        this.mercStatsContainer.appendChild(expDiv);

        statsToShow.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.className = 'stat-line';
            const statValue = typeof mercenary.stats.get(stat) === 'number'
                ? mercenary.stats.get(stat).toFixed(1)
                : mercenary.stats.get(stat);
            statDiv.textContent = `${stat}: ${statValue}`;
            this.mercStatsContainer.appendChild(statDiv);
        });

        this.mercDetailPanel.classList.remove('hidden');
    }

    hideMercenaryDetail() {
        if (this.mercDetailPanel) {
            this.mercDetailPanel.classList.add('hidden');
        }
    }

    updateUI(gameState) {
        const player = gameState.player;
        const stats = player.stats;
        this.levelElement.textContent = stats.get('level');
        this.statPointsElement.textContent = gameState.statPoints;
        const primaryStats = ['strength', 'agility', 'endurance', 'focus', 'intelligence', 'movement'];
        primaryStats.forEach(stat => {
            const valueElement = document.getElementById(`ui-player-${stat}`);
            const buttonElement = valueElement ? valueElement.nextElementSibling : null;
            if (valueElement) valueElement.textContent = stats.get(stat);
            if (buttonElement) {
                buttonElement.style.display = gameState.statPoints > 0 ? 'inline-block' : 'none';
            }
        });
        this.hpElement.textContent = Math.ceil(player.hp);
        this.maxHpElement.textContent = stats.get('maxHp');
        this.attackPowerElement.textContent = stats.get('attackPower');
        this.movementSpeedElement.textContent = stats.get('movementSpeed').toFixed(2);
        this.goldElement.textContent = gameState.gold;
        const hpRatio = player.hp / player.maxHp;
        this.hpBarFillElement.style.width = `${hpRatio * 100}%`;
        const expRatio = stats.get('exp') / stats.get('expNeeded');
        this.expBarFillElement.style.width = `${expRatio * 100}%`;
        this.expTextElement.textContent = `${stats.get('exp')} / ${stats.get('expNeeded')}`;
        if (this._hasInventoryChanged(gameState.inventory)) {
            this.inventorySlotsElement.innerHTML = '';
            gameState.inventory.forEach((item, index) => {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                const img = document.createElement('img');
                img.src = item.image.src;
                img.alt = item.name;
                slot.onclick = () => {
                    this.useItem(index, gameState);
                };
                slot.appendChild(img);
                this.inventorySlotsElement.appendChild(slot);
            });
            this._lastInventory = [...gameState.inventory];
        }
    }

    _hasInventoryChanged(current) {
        if (current.length !== this._lastInventory.length) return true;
        for (let i = 0; i < current.length; i++) {
            if (current[i] !== this._lastInventory[i]) return true;
        }
        return false;
    }

    useItem(itemIndex, gameState) {
        const item = gameState.inventory[itemIndex];
        if (!item) return;

        if (item.tags.includes('weapon') || item.tags.includes('armor')) {
            this._showEquipTargetPanel(item, gameState);
        } else if (item.name === 'potion') {
            const player = gameState.player;
            player.hp = Math.min(player.maxHp, player.hp + 5);
            console.log(`포션을 사용했습니다! HP +5`);
            gameState.inventory.splice(itemIndex, 1);
            this.updateUI(gameState);
        }
    }

    _showEquipTargetPanel(item, gameState) {
        if (!this.equipTargetPanel) return;

        this.equipTargetList.innerHTML = '';
        const targets = [gameState.player, ...(this.mercenaryManager ? this.mercenaryManager.mercenaries : [])];

        targets.forEach((target, idx) => {
            const button = document.createElement('button');
            if (target.isPlayer) {
                button.textContent = '플레이어';
            } else {
                button.textContent = `용병 ${idx}`;
            }
            button.onclick = () => {
                if (this.onEquipItem) this.onEquipItem(target, item);
                this.hideEquipTargetPanel();
            };
            this.equipTargetList.appendChild(button);
        });

        this.equipTargetPanel.classList.remove('hidden');
    }

    hideEquipTargetPanel() {
        if (this.equipTargetPanel) {
            this.equipTargetPanel.classList.add('hidden');
        }
    }

    renderHpBars(ctx, player, monsters, mercenaries) {
        for (const monster of monsters) {
            this._drawHpBar(ctx, monster);
        }
        for (const merc of mercenaries) {
            this._drawHpBar(ctx, merc);
        }
    }

    _drawHpBar(ctx, entity) {
        if (entity.hp >= entity.maxHp || entity.hp <= 0) return;
        const barWidth = entity.width;
        const barHeight = 8;
        const x = entity.x;
        const y = entity.y - barHeight - 5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        const hpRatio = entity.hp / entity.maxHp;
        ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.2 ? '#ffff00' : '#ff0000';
        ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}

export class ItemManager {
    constructor(itemCount, mapManager, assets) {
        this.items = [];
        this.mapManager = mapManager;
        this.assets = assets;
        this._spawnItems(itemCount);
    }

    _spawnItems(count) {
        for (let i = 0; i < count; i++) {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                if (Math.random() < 0.5) {
                    this.items.push(new Item(pos.x, pos.y, this.mapManager.tileSize, 'gold', this.assets.gold));
                } else {
                    this.items.push(new Item(pos.x, pos.y, this.mapManager.tileSize, 'potion', this.assets.potion));
                }
            }
        }
    }

    removeItem(itemToRemove) {
        this.items = this.items.filter(item => item !== itemToRemove);
    }

    render(ctx) {
        for (const item of this.items) {
            item.render(ctx);
        }
    }
}

export class EquipmentManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    equip(entity, item, inventory) {
        const slot = this._getSlotForItem(item);
        if (!slot) return;

        // 기존 아이템이 있었다면 인벤토리로 반환
        const oldItem = entity.equipment[slot];
        if (oldItem && inventory) {
            inventory.push(oldItem);
        }

        // 새 아이템 장착
        entity.equipment[slot] = item;

        // 장비 변경 후 스탯과 AI 업데이트
        if (entity.stats.updateEquipmentStats) {
            entity.stats.updateEquipmentStats();
        }
        if (entity.updateAI) entity.updateAI();

        this.eventManager.publish('log', { message: `${entity.constructor.name} (이)가 ${item.name} (을)를 장착했습니다.` });
    }

    _getSlotForItem(item) {
        if (item.tags.includes('weapon') || item.type === 'weapon') return 'weapon';
        if (item.tags.includes('armor') || item.type === 'armor') return 'armor';
        return null;
    }
}

export class MetaAIManager extends BaseMetaAI {
    executeAction(entity, action, context) {
        if (!action) return;
        const { player, mapManager, onPlayerAttack, onMonsterAttacked } = context;
        switch (action.type) {
            case 'attack':
                if (entity.attackCooldown === 0) {
                    if (entity.isFriendly) {
                        onMonsterAttacked(action.target.id, entity.attackPower);
                    } else {
                        onPlayerAttack(entity.attackPower);
                    }
                    entity.attackCooldown = 60;
                }
                break;
            case 'move':
                const dx = action.target.x - entity.x;
                const dy = action.target.y - entity.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= entity.speed) {
                    if (!mapManager.isWallAt(action.target.x, action.target.y, entity.width, entity.height)) {
                        entity.x = action.target.x;
                        entity.y = action.target.y;
                    }
                } else {
                    let moveX = (dx / distance) * entity.speed;
                    let moveY = (dy / distance) * entity.speed;
                    const newX = entity.x + moveX;
                    const newY = entity.y + moveY;
                    if (!mapManager.isWallAt(newX, newY, entity.width, entity.height)) {
                        entity.x = newX;
                        entity.y = newY;
                    }
                }
                break;
            case 'idle':
            default:
                break;
        }
    }

    update(context) {
        for (const groupId in this.groups) {
            const group = this.groups[groupId];
            for (const member of group.members) {
                if (member.attackCooldown > 0) member.attackCooldown--;
                if (member.ai) {
                    const action = member.ai.decideAction(member, context);
                    this.executeAction(member, action, context);
                }
            }
        }
    }
}
