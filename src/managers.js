// src/managers.js

import { Monster, Item, Mercenary } from './entities.js'; // Mercenary 추가
import { MetaAIManager as BaseMetaAI } from './ai-managers.js'; // 이름 충돌 방지

export class MonsterManager {
    constructor(monsterCount, mapManager, assets) {
        this.monsters = [];
        this.mapManager = mapManager;
        this.assets = assets;
        this._spawnMonsters(monsterCount);
    }

    _spawnMonsters(count) {
        for (let i = 0; i < count; i++) {
            let size = { w: 1, h: 1 };
            let image = this.assets.monster;
            if (Math.random() < 0.25) {
                size = { w: 2, h: 2 };
                image = this.assets.epic_monster;
            }

            let pos;
            if (size.w > 1) {
                if (this.mapManager.rooms.length > 0) {
                    const room = this.mapManager.rooms[Math.floor(Math.random() * this.mapManager.rooms.length)];
                    pos = { x: room.x * this.mapManager.tileSize, y: room.y * this.mapManager.tileSize };
                }
            } else {
                pos = this.mapManager.getRandomFloorPosition(size);
            }

            if (pos) {
                const config = {
                    sizeInTiles_w: size.w,
                    sizeInTiles_h: size.h,
                    strength: size.w > 1 ? 2 : 1,
                    endurance: size.w > 1 ? 2 : 0,
                    visionRange: 192 * 5,
                    attackRange: 192,
                    expValue: size.w > 1 ? 15 : 5
                };
                this.monsters.push(new Monster(pos.x, pos.y, this.mapManager.tileSize, image, 0, config));
            }
        }
    }

    handleAttackOnMonster(monsterId, damage) {
        const monster = this.monsters.find(m => m.id === monsterId);
        if (monster) {
            monster.takeDamage(damage);
            // 죽었는지 여부만 반환
            return monster.hp <= 0 ? { wasKilled: true, victim: monster } : { wasKilled: false };
        }
        return { wasKilled: false };
    }

    // 이벤트 매니저가 "이 몬스터 제거해"라고 알려주면, 그때 제거만 함
    removeMonster(monsterId) {
        this.monsters = this.monsters.filter(m => m.id !== monsterId);
    }

    getMonsterAt(x, y) {
        for (const monster of this.monsters) {
            if (x >= monster.x && x < monster.x + monster.width &&
                y >= monster.y && y < monster.y + monster.height) {
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

// === MercenaryManager 새로 추가 ===
export class MercenaryManager {
    constructor(assets) {
        this.mercenaries = [];
        this.assets = assets;
    }

    hireMercenary(x, y, tileSize, groupId) {
        const job = {
            strength: 2,
            agility: 2,
            endurance: 2,
            movement: 4,
            visionRange: 192 * 4,
            attackRange: 192 * 0.8
        };
        const newMerc = new Mercenary(x, y, tileSize, this.assets.mercenary, groupId, job);
        this.mercenaries.push(newMerc);
        return newMerc;
    }

    render(ctx) {
        for (const merc of this.mercenaries) {
            merc.render(ctx);
        }
    }
}

// === UIManager 클래스 전체 수정 ===
export class UIManager {
    constructor() {
        // UI 요소들 찾아두기
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

        // 버튼 이벤트 위임을 위해 부모 컨테이너를 저장
        this.statUpButtonsContainer = document.getElementById('player-stats-container');

        // 현재 인벤토리 상태 저장용 배열 (UI 빈번한 재생성 방지)
        this._lastInventory = [];

        this._statUpCallback = null;
        this._isInitialized = false;
    }

    init(onStatUp) {
        if (this._isInitialized) return;
        this._statUpCallback = onStatUp;
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
        this._isInitialized = true;
    }

    setStatUpCallback(cb) {
        this.init(cb);
    }

    updateUI(gameState) {
        const player = gameState.player;
        const stats = player.stats;

        // 스탯 업데이트 - StatManager에서 값을 읽어옴
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

        // HP 바 업데이트
        const hpRatio = player.hp / player.maxHp;
        this.hpBarFillElement.style.width = `${hpRatio * 100}%`;

        // 경험치 바 업데이트
        const expRatio = stats.get('exp') / stats.get('expNeeded');
        this.expBarFillElement.style.width = `${expRatio * 100}%`;
        this.expTextElement.textContent = `${stats.get('exp')} / ${stats.get('expNeeded')}`;



        // 인벤토리 내용이 변경된 경우에만 DOM을 갱신하여 클릭 이벤트 손실을 방지
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

            // 변화된 인벤토리 상태 저장
            this._lastInventory = [...gameState.inventory];
        }
    }

    // 현재 인벤토리가 마지막으로 렌더링한 인벤토리와 다른지 확인
    _hasInventoryChanged(current) {
        if (current.length !== this._lastInventory.length) return true;
        for (let i = 0; i < current.length; i++) {
            if (current[i] !== this._lastInventory[i]) return true;
        }
        return false;
    }

    // 인벤토리 아이템 사용 로직
    // useItem도 gameState를 인자로 받도록 수정
    useItem(itemIndex, gameState) {
        const player = gameState.player;
        const item = gameState.inventory[itemIndex];

        if (item.name === 'potion') {
            player.hp = Math.min(player.maxHp, player.hp + 5);
            console.log(`포션을 사용했습니다! HP +5`);
        }

        // 사용한 아이템을 제거
        gameState.inventory.splice(itemIndex, 1);

        // UI를 다시 그려서 변경사항을 즉시 반영
        this.updateUI(gameState);
    }

    // HP 바를 그리는 메서드 (이전과 동일)
    renderHpBars(ctx, player, monsters, mercenaries) {
        // 플레이어 HP바는 이제 여기서 그리지 않음 (HTML로 완전히 이전)
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

// === 아래 ItemManager 클래스를 파일 맨 아래에 새로 추가 ===
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
                // 50% 확률로 골드 또는 포션 생성
                if (Math.random() < 0.5) {
                    this.items.push(
                        new Item(pos.x, pos.y, this.mapManager.tileSize, 'gold', this.assets.gold)
                    );
                } else {
                    this.items.push(
                        new Item(pos.x, pos.y, this.mapManager.tileSize, 'potion', this.assets.potion)
                    );
                }
            }
        }
    }

    // 특정 아이템을 맵에서 제거하는 함수
    removeItem(itemToRemove) {
        this.items = this.items.filter(item => item !== itemToRemove);
    }

    render(ctx) {
        for (const item of this.items) {
            item.render(ctx);
        }
    }
}

// === MetaAIManager 로직 수정 ===
export class MetaAIManager extends BaseMetaAI {
    // 유닛의 행동을 실제로 실행하는 함수
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
                if (distance > 1) {
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
