// src/managers.js

import { Monster } from './entities.js';
import { Item } from './entities.js'; // Item 클래스를 불러옵니다.

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
                this.monsters.push(new Monster(pos.x, pos.y, this.mapManager.tileSize, image, size));
            }
        }
    }

    handleAttackOnMonster(monsterId, damage) {
        const monster = this.monsters.find(m => m.id === monsterId);
        if (monster) {
            monster.takeDamage(damage);
            if (monster.hp <= 0) {
                this.monsters = this.monsters.filter(m => m.id !== monsterId);
            }
        }
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
            monster.update(player, this.mapManager, onPlayerAttack);
        }
    }

    render(ctx) {
        for (const monster of this.monsters) {
            monster.render(ctx);
        }
    }
}

// === UIManager 클래스 전체 수정 ===
export class UIManager {
    constructor() {
        this.statsContainer = document.getElementById('player-stats-container');
        this.goldElement = document.getElementById('ui-player-gold');
        this.inventorySlotsElement = document.getElementById('inventory-slots');

        // HP, 공격력 등 스탯 관련 요소
        this.hpElement = document.getElementById('ui-player-hp');
        this.maxHpElement = document.getElementById('ui-player-maxHp');
        this.attackPowerElement = document.getElementById('ui-player-attackPower');
        this.hpBarFillElement = document.getElementById('ui-hp-bar-fill');

    }

    // gameState를 인자로 받도록 수정
    updateUI(gameState) {
        if (!gameState) return;

        const player = gameState.player;

        // 기본 능력치 표시
        this.hpElement.textContent = player.hp;
        this.maxHpElement.textContent = player.maxHp;
        this.attackPowerElement.textContent = player.attackPower;

        const hpRatio = player.hp / player.maxHp;
        this.hpBarFillElement.style.width = `${hpRatio * 100}%`;

        // 골드 UI 업데이트
        this.goldElement.textContent = gameState.gold;

        // 인벤토리 UI 업데이트
        this.inventorySlotsElement.innerHTML = '';
        gameState.inventory.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            const img = document.createElement('img');
            img.src = item.image.src;
            img.alt = item.name;

            // 클릭 이벤트가 gameState를 함께 전달하도록 수정
            slot.onclick = () => {
                this.useItem(index, gameState);
            };

            slot.appendChild(img);
            this.inventorySlotsElement.appendChild(slot);
        });
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
    renderHpBars(ctx, player, monsters) {
        // this._drawHpBar(ctx, player); // 플레이어 HP바는 이제 HTML UI로 옮겼으므로 주석 처리
        for (const monster of monsters) {
            this._drawHpBar(ctx, monster);
        }
    }

    _drawHpBar(ctx, entity) {
        if (entity.hp <= 0 || entity.hp === entity.maxHp) {
            return;
        }
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
